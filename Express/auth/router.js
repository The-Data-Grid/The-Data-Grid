const express = require('express'); 
const router = express.Router(); //use router instead of app
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const isTesting = ['-t', '--test'].includes(process.argv[2]);

const {postgresClient} = require('../db/pg.js'); 

// get connection object
const db = postgresClient.getConnection.db;
// get SQL formatter
const formatSQL = postgresClient.format;

const { isValidEmail, isValidDate, isValidPassword } = require('../validate.js');
const { apiDateToUTC } = require('../parse.js');
const SQL = require('../statement.js').login;
const userSQL = require('../statement.js').addingUsers;
const updating = require('../statement.js').updates;

// Login
router.post('/login', async (req, res) => {
    try {
        const password = (await db.one(formatSQL(SQL.password, {
            checkemail: req.body.email,
        }))).password;

        let result = await bcrypt.compare(req.body.pass, password); 

        if (result) {
            // get and set session information
            const sessionData = await db.one(formatSQL(SQL.authorization, {
                checkemail: req.body.email,
            }));

            const sessionObject = {
                loggedIn: true,
                email: req.body.email,
                role: sessionData.role,
                userID: sessionData.userID,
                organizationID: sessionData.organizationID,
                privilege: sessionData.privilege,
            };
            
            // update session
            Object.assign(req.session, sessionObject)
            
            // return sessionObject to frontend
            return res.status(200).json(sessionObject);
        }
        else {
            throw new Error('Invalid');
        }
    }
    catch(error) {
        console.log('ERROR:', error);
        return res.status(401).send('Invalid email or password or account has not verified email');
    }
});

// Logout
router.post('/logout', (req, res) => {
    if (req.session.loggedIn !== true) {
        return res.status(400).send('you already logged out.');
    } 
    else {
        req.session.destroy();
        return res.send('you just logged out!'); 
    }
});

// New user register
router.post('/', async (req, res) => {
    if (!isValidPassword(req.body.pass)) {
        console.log('ERROR:', 'Bad Request 2211: Invalid Password');
        return res.status(400).send('Bad Request 2211: Invalid Password'); 
    }

    if (!isValidEmail(req.body.email)) {
        console.log('ERROR:', 'Bad Request 2211: Invalid Password');
        return res.status(400).send('Bad Request 2211: Invalid Password'); 
    }

    if (!isValidDate(req.body.dateOfBirth)) {
        console.log('ERROR:', 'Bad Request 2213: Invalid Date');
        return res.status(400).send('Bad Request 2213: Invalid Date'); 
    }

    //check if email is taken 
    try {
        await db.none(formatSQL(SQL.isEmailTaken, {
            checkemail: req.body.email
        }));
    } catch(error) {
        console.log('ERROR:', error);
        return es.status(400).send('Bad Request 2214: Email already taken');
    }
    
    // insert
    try {
        //hash password
        let hashedPassword = await bcrypt.hash(req.body.pass, 13); 

        await db.none(formatSQL(userSQL.insertingUsers, {
            userfirstname: req.body.firstName,
            userlastname: req.body.lastName,
            useremail: req.body.email,
            userpass:  hashedPassword,
            userdateofbirth: apiDateToUTC(req.body.dateOfBirth),
            userpublic: req.body.isEmailPublic,
            userquarterlyupdates: req.body.isQuarterlyUpdates,
        }));

        // send verification email
        const rand = nanoid(50);
        await db.none(formatSQL(updating.updateToken, {
            token: rand, //secret token for security
            email: req.body.email
        }));
        //encode email as part of the link
        const encodedEmail = encodeURIComponent(req.body.email);
        emailLink = "https://thedatagrid.org/verify-email?email=" + encodedEmail + "&token=" + rand; 

        await sendEmail(req.body.email, emailLink);

    } catch(err) {
        console.log(err);
        return res.status(500).end();
    }

    return res.status(201).end();
});

// Verify email link of new user  
router.post('/email/verify', async (req, res) => { 
    try {
        const {
            email,
            token,
        } = req.body;
        const decodedEmail = decodeURIComponent(email);

        // will throw unless both values match
        await db.one(formatSQL(SQL.secret, {
            checkemail: decodedEmail,
            token,
        }));
        
        try {
            await db.none(formatSQL(updating.updateStatus, {
                email: decodedEmail,
                isPending: false,
            }));
        } catch(error) {
            return res.status(500).send('Server error when updating account status');
        }
        return res.status(200).send('Email verified');

    } catch(error) {
        return res.status(401).send('Email verification failed');
    }
});


// Send email to user for password reset  
router.post('/password/request-reset', async (req, res) => {
    const rand = nanoid(50);
    try {
        await db.none(formatSQL(updating.updateToken, {
            token: rand,
            email: req.body.email,
        }));

        const encodedEmail = encodeURIComponent(req.body.email);
        const emailLink = "https://thedatagrid.org/reset-password?email=" + encodedEmail + "?token=" + rand; 
        
        await sendEmail(req.body.email, emailLink);

        return res.status(201).end();
    } catch(error) {
        console.log('ERROR:', error);
        return res.status(400).send('Account with email does not exist or account with email isn\'t verified');
    }
});


// User identity for requesting password reset is confirmed
router.post('/password/reset', async (req, res) => {
    try {
        const {
            email,
            token,
            pass,
        } = req.body;
        
        const hashedPassword = await bcrypt.hash(pass, 13); 

        const decodedEmail = decodeURIComponent(email);
        
        // will throw unless both values match
        await db.one(formatSQL(SQL.secret, {
            checkemail: decodedEmail,
            token,
        }));

        try {
            await db.none(formatSQL(updating.updatePassword, {
                email: decodedEmail,
                password: hashedPassword,
            }));
        } catch(error) {
            return res.status(500).send('Server error when resetting password');
        }
        return res.status(200).send('Password reset');
        
    } catch(error) {
        return res.status(401).send('Password reset unauthorized');
    }
});

// Set a new role
/*
{
    userEmail: String,
    organizationID: Number,
    role: 'admin' | 'auditor'
}
*/
const roleIDLookup = {
    auditor: 1,
    admin: 2,
};
router.put('/role', async (req, res) => {
    try {
        const {
            userEmail,
            organizationID,
            role
        } = req.body;
        const roleID = roleIDLookup[role];

        // check for superuser or admin if attempt to set admin role
        if(role === 'admin') {
            if(res.locals.authorization.privilege !== 'superuser') {
                const orgIndex = res.locals.authorization.organizationID.indexOf(organizationID);
                if(res.locals.authorization.role[orgIndex] !== 'admin') {
                    return res.status(401).send('Must be an admin of organization to set roles for it');
                }  
            }
        }
        // make sure user is an admin of the organization they are attempting to set role of
        else if(role === 'auditor') {
            if(res.locals.authorization.privilege !== 'superuser') {
                const orgIndex = res.locals.authorization.organizationID.indexOf(organizationID);
                if(res.locals.authorization.role[orgIndex] !== 'admin') {
                    return res.status(401).send('Must be an admin of organization to set roles for it');
                }
            }
        } else {
            return res.status(400).send(`Role must be 'auditor' or 'admin'`);
        }

        // first get userID
        const userID = (await db.one(formatSQL(`
            SELECT item_id FROM item_user
            WHERE data_email = $(userEmail)
        `, {
            userEmail,
        }))).item_id;
        // clear existing if exists
        await db.oneOrNone(formatSQL(`
            DELETE FROM tdg_role
            WHERE item_organization_id = $(organizationID)
            AND item_user_id = $(userID)
        `, {
            userID,
            organizationID,
        }))
        // now add new
        await db.none(formatSQL(`
            INSERT INTO tdg_role
            (item_organization_id, item_user_id, role_type_id)
            VALUES
            ($(organizationID), $(userID), $(roleID))
        `, {
            organizationID,
            userID,
            roleID,
        }));
  
        return res.status(201).end();
    } catch(err) {
        console.log(err);
        return res.status(500).send('Server error when setting role');
    }
})

// Just for testing
async function sendEmail(_, __) {
    
}

module.exports = router;
