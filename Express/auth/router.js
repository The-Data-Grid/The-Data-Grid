const express = require('express'); 
const router = express.Router(); //use router instead of app
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const isTesting = ['-t', '--test'].includes(process.argv[2]);

const {postgresClient} = require('../pg.js'); 

// get SQL formatter
const formatSQL = postgresClient.format;

const { isValidEmail, isValidDate, isValidPassword } = require('../parse/validate.js');
const { apiDateToUTC, parseOrganizationID } = require('../parse/parse.js');
const SQL = require('../statement.js').login;
const userSQL = require('../statement.js').addingUsers;
const updating = require('../statement.js').updates;
const { sendMail } = require('../email/mda.js');
const { authorizeAuditor } = require('./authorizer.js');

// use correct mail depending on testing
let sendEmail = sendMail;
if(isTesting) {
    sendEmail = sendEmailFake;
}

// Login
router.post('/login', async (req, res) => {
    const db = res.locals.databaseConnection;
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
                firstName: sessionData.firstName,
                lastName: sessionData.lastName,
                email: req.body.email,
                role: sessionData.role,
                userID: sessionData.userID,
                organizationID: sessionData.organizationID,
                organizationFrontendName: sessionData.organizationName,
                privilege: sessionData.privilege,
                isApiKeySet: sessionData.isApiKeySet, // Boolean of whether an api key has been set yet, not exposing api key itself in cookie
                databaseName: databaseConnectionName,
            };
            
            // update session
            Object.assign(req.session, sessionObject)
            
            // return sessionObject to frontend
            return res.status(200).json(sessionObject);
        }
        else {
            throw new Error('Invalid Password');
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
    const db = res.locals.databaseConnection;
    if (!isValidPassword(req.body.pass)) {
        console.log('ERROR:', 'Bad Request 2211: Invalid Password');
        return res.status(400).send('Bad Request 2211: Invalid Password'); 
    }

    if (!isValidEmail(req.body.email)) {
        console.log('ERROR:', 'Bad Request 2211: Invalid Password');
        return res.status(400).send('Bad Request 2212: Invalid Email'); 
    }

    /*
    if (!isValidDate(req.body.dateOfBirth)) {
        console.log('ERROR:', 'Bad Request 2213: Invalid Date');
        return res.status(400).send('Bad Request 2213: Invalid Date'); 
    }
    */

    //check if email is taken 
    try {   
        await db.none(formatSQL(SQL.isEmailTaken, {
            checkemail: req.body.email
        }));
    } catch(error) {
        console.log('ERROR:', error);
        return res.status(400).send('Bad Request 2214: Email already taken');
    }
    
    // insert
    try {
        //hash password
        let hashedPassword = await bcrypt.hash(req.body.pass, 13); 

        const rand = nanoid(50);

        await db.none(formatSQL(userSQL.insertingUsers, {
            userfirstname: req.body.firstName,
            userlastname: req.body.lastName,
            useremail: req.body.email,
            userpass:  hashedPassword,
            userpublic: req.body.isEmailPublic,
            userquarterlyupdates: req.body.isQuarterlyUpdates,
            token: rand,
        }));

        // send verification email
        await db.none(formatSQL(updating.updateToken, {
            token: rand, //secret token for security
            email: req.body.email
        }));
        //encode email as part of the link
        const encodedEmail = encodeURIComponent(req.body.email);
        emailLink = "https://thedatagrid.org/verify-email?email=" + encodedEmail + "&token=" + rand; 

        console.log('User inserted. Sending email to ' + req.body.email + ' with link: ' + emailLink);

        await sendEmail({
            address: req.body.email,
            title: 'The Data Grid - Email Verification',
            body: emailLink
        });

        console.log('Email sent.')

    } catch(err) {
        console.log(err);
        return res.status(500).end();
    }

    return res.status(201).end();
});

router.get('/', async (req, res) => {
    const db = res.locals.databaseConnection;
    try {
        // first get userID from session
        const { userID, loggedIn } = req.session;

        if(loggedIn !== true) {
            return res.status(401).end();
        }

        let userData = await db.one(formatSQL(SQL.user, {
            userID
        }));

        return res.status(200).json(userData);

    } catch(err) {
        console.log(err);
        return res.status(500).end();
    }
})

// Verify email link of new user  
router.post('/email/verify', async (req, res) => {
    const db = res.locals.databaseConnection;
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
        console.log(error)
        return res.status(401).send('Email verification failed');
    }
});


// Send email to user for password reset  
router.post('/password/request-reset', async (req, res) => {
    const db = res.locals.databaseConnection;
    const rand = nanoid(50);
    try {
        await db.none(formatSQL(updating.updateToken, {
            token: rand,
            email: req.body.email,
        }));

        const encodedEmail = encodeURIComponent(req.body.email);
        const emailLink = "https://thedatagrid.org/reset-password?email=" + encodedEmail + "?token=" + rand; 

        console.log('Sending email to ' + req.body.email + ' with link: ' + emailLink);
        
        await sendEmail({
            address: req.body.email,
            title: 'The Data Grid - Password Reset',
            body: emailLink
        });

        console.log('Email sent.');

        return res.status(201).end();
    } catch(error) {
        console.log('ERROR:', error);
        return res.status(400).send('Account with email does not exist or account with email isn\'t verified');
    }
});


// User identity for requesting password reset is confirmed
router.post('/password/reset', async (req, res) => {
    const db = res.locals.databaseConnection;
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
    const db = res.locals.databaseConnection;
    try {
        const {
            userEmail,
            organizationID,
            role
        } = req.body;
        const roleID = role === null ? null : roleIDLookup[role];

        // check for superuser or admin if attempt to set admin role
        if(role === 'admin') {
            if(res.locals.authorization.privilege !== 'superuser') {
                //const orgIndex = res.locals.authorization.organizationID.indexOf(organizationID);
                //if(res.locals.authorization.role[orgIndex] !== 'admin') {
                    return res.status(401).send('Must be a database superuser to set admin roles for it');
                //}  
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
        } 
        // Then trying to remove a role
        else if(role === null) {
            if(res.locals.authorization.privilege !== 'superuser') {
                const orgIndex = res.locals.authorization.organizationID.indexOf(organizationID);
                if(res.locals.authorization.role[orgIndex] !== 'admin') {
                    return res.status(401).send('Must be an admin of organization to remove roles for it');
                }
            }
        } 
        else {
            return res.status(400).send(`Role must be 'auditor' or 'admin'`);
        }

        // first get userID
        let userID;
        try {
            userID = (await db.one(formatSQL(`
                SELECT item_id FROM item_user
                WHERE data_email = $(userEmail)
            `, {
                userEmail,
            }))).item_id;
        } catch(err) {
            return res.status(400).send('No user with provided email');
        }

        // get current role for privilege check
        const currentRole = await db.oneOrNone(formatSQL(`
            SELECT t.type_name AS type
            FROM tdg_role_type AS t
            INNER JOIN tdg_role AS r ON r.role_type_id = t.type_id
            WHERE r.item_organization_id = $(organizationID)
            AND r.item_user_id = $(userID)
        `, {
            userID,
            organizationID,
        }));

        if(currentRole !== null) {
            if(currentRole.type == 'admin' && res.locals.authorization.privilege !== 'superuser') {
                return res.status(401).send('Must be a superuser to modify the role of an existing admin');
            }
        }

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
        if(role !== null) {
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
        }
  
        return res.status(201).end();
    } catch(err) {
        console.log(err);
        return res.status(500).send('Server error when setting role');
    }
});

router.get('/role', parseOrganizationID, authorizeAuditor, async (req, res) => {
    const db = res.locals.databaseConnection;
    try {
        const data = await db.any(formatSQL(`
            SELECT 
                u.data_first_name as "firstName",
                u.data_last_name as "lastName",
                rt.type_name as "role",
                u.data_email as "email"
                    FROM item_user as u
                    INNER JOIN tdg_role as r on u.item_id = r.item_user_id
                    INNER JOIN tdg_role_type as rt on r.role_type_id = rt.type_id
                        WHERE r.item_organization_id = $(organizationID)
        `, {
            organizationID: res.locals.requestedOrganizationID
        }));

        return res.status(200).json(data)

    } catch(err) {
        console.log(err);
        return res.status(500).end();
    }
})

// Just for testing
async function sendEmailFake(_) {
    
}

module.exports = router;
