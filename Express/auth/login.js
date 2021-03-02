const express = require('express'); 
const router = express.Router(); //use router instead of app
const session = require('express-session'); 
const bcrypt = require('bcrypt');
var cors = require('cors')

const {postgresClient} = require('../db/pg.js'); 

var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }  

// get connection object
const db = postgresClient.getConnection.db;
// get SQL formatter
const formatSQL = postgresClient.format;

const {isValidEmail, isValidDate, isValidPassword} = require('../validate.js');

const {apiDateToUTC} = require('../parse.js');

const SQL = require('../statement.js').login;
const userSQL = require('../statement.js').addingUsers;

const updating = require('../statement.js').updates;


// session store init
let Store = require('memorystore')(session); 
let MyStore = new Store({checkPeriod: 1000000});

// router.use(corsOptions);

// Session on every route
router.use(session({
    store: MyStore, 
    secret: 'shhhhh',
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        // 1 day
        maxAge: 86_400_000, 
        // make sure this is secure in prod
        secure: (process.env.NODE_ENV == 'development' ? false : true)
    }
}));

// Login
router.post('/login', cors(corsOptions), async (req, res) => {

    let data = null;
    try {
        data = await db.one(formatSQL(SQL.password, {
            checkemail: req.body.email
        }));

        let result = await bcrypt.compare(req.body.pass, data.password); 

        if (result) {
            req.session.loggedIn = true;
            req.session.email = req.body.email;
            req.session.role = data.role;
            // res.clearCookie(req.session);
            // res.clearCookie(req.body.email);
            // res.cookie(req.session);
            // res.cookie(req.body.email);
            res.send('password matched and you logged in');
        }
        else {
            throw new Error('error');
        }
    }
    catch(error) {
        console.log('ERROR:', error);
        res.status(401).send('not a valid combo');
    }
});

// Logout
router.post('/logout', (req, res) => {
    if (req.session.loggedIn !== true) {
        res.status(400).send('you already logged out.');
    } 
    else {
        req.session.destroy();
        res.send('you just logged out!'); 
    }
});


// New user register
router.post('/user/new', async (req, res) => {
    if (!isValidPassword(req.body.pass)) {
        res.status(400).send('Bad Request 2211: Invalid Password'); 
    }

    if (!isValidEmail(req.body.email)) {
        res.status(400).send('Bad Request 2212: Invalid Email'); 
    }

    if (!isValidDate(req.body.dateOfBirth)) {
        res.status(400).send('Bad Request 2213: Invalid Date'); 
    }

    //check if email is taken 
    try {
        const data = await db.oneOrNone(formatSQL(SQL.isEmailTaken, {
            checkemail: req.body.email
        }));

        if (data != null) {
            res.status(400).send('Bad Request 2214: Email already taken');
        }
    }
    catch(error) {
        console.log('ERROR:', error);
        res.status(500).send('Internal Server Error 7702');
    }

    //hash password
    let hashedPassword = await bcrypt.hash(req.body.pass, 10); 

userSQL.insertingUsers= {
    userfirstname: req.body.firstName,
    userlastname: req.body.lastName,
    useremail: req.body.email,
    userpass:  hashedPassword,
    userdateofbirth: apiDateToUTC(req.body.dateOfBirth),
    userpublic: req.body.isEmailPublic,
    userquarterlyupdates: req.body.isQuarterlyUpdates
    }

    res.send('registration successful')
});





// Send verfication email to new user  
router.post('/sendVerfiyEmail', async (req, res) => {
    rand = Date.now() + Math.floor(Math.random() * 100 + 54); 
    try {
        await db.none(formatSQL(userSQL.updateUserSecret, {
                random: rand, //secret token for security
                email: req.body.email
        }))
    } catch(error) {
        console.log('ERROR:', error);
        res.status(500).send('service internal error');
    }
    //encode email as part of the link
    let encodedEmail = Buffer.from(req.body.email, 'utf8').toString('base64');
    emailLink = "/verifyEmailLink/" + encodedEmail + "?id=" + rand; 
    
    sendEmail(req.body.email, emailLink); //sendEmail function not implemented yet
    
});


// Verify email link of new user  
router.post('/verifyEmailLink', async (req, res) => { 
    try {
        decodedEmail = Buffer.from(req.body.email, 'base64').toString('utf8');
        data = await db.one(formatSQL(SQL.secret, {
            checkemail: decodedEmail
        }));
        
        if (data.secret == req.body.secret) {
            await db.none(formatSQL(userSQL.updateUserStatus, {
                useremail: decodedEmail,
                status: "active"
            }))
            res.status(200).send("Email verified");
        } else {
            res.status(404).send("Email verification failed");
        }   
    } catch(error) {
        console.log('ERROR:', error);
        res.status(500).send('service internal error');
    }
});


// Send email to user for password reset  
router.post('/sendPasswordResetEmail', async (req, res) => {
    rand = Date.now() + Math.floor(Math.random() * 100 + 54);
    try {
        await db.none(formatSQL(userSQL.updateUserSecret, {
                random: rand,
                email: req.body.email
        }))
    } catch(error) {
        console.log('ERROR:', error);
        res.status(500).send('service internal error');
    }
    let encodedEmail = Buffer.from(req.body.email, 'utf8').toString('base64');
    emailLink = "/verifyPasswordResetLink/" + encodedEmail + "?id=" + rand; 
    
    sendEmail(req.body.email, emailLink); //sendEmail function not implemented yet
});


// User identity for requesting password reset is confirmed
router.post('/verifyPasswordResetLink', async (req, res) => {
    try {
        decodedEmail = Buffer.from(req.body.email, 'base64').toString('utf8');
        data = await db.one(formatSQL(SQL.secret, {
            checkemail: decodedEmail
        }));

        if (data.secret == req.body.secret) {
            res.status(200).send("Password reset verified");
        } else {
            res.status(404).send("Password reset verification failed");
        }
    } catch(error) {
        console.log('ERROR:', error);
        res.status(500).send('service internal error');
    }
});

// Update new password
router.post('ResetPassword', async (req, res) => {
    let hashedPassword = await bcrypt.hash(req.body.pass, 10); 
    try {
        await db.none(formatSQL(userSQL.updateUserPassword, {
                useremail: req.body.email,
                password: hashedPassword
        }))
        res.status(200).send("Password reset successfully");
    } catch(error) {
        console.log('ERROR:', error);
        res.status(500).send('service internal error');
    }
});

module.exports = router





/************************************
Route Auth Testing -- For next sprint
*************************************
router.get('/secure', (req, res) => {
    // if the session store shows that the user is logged in
    if(req.session.loggedIn) {
        res.send(`Here is your confidential data, ${req.session.email}`);
        // logging the contents of the entire session store
        MyStore.all((err, session) => {
            console.log(session)
        });
        
    } else {    
        res.send('Permission Denied');
    };
});
function authorize(path) {
    return((req, res, next) => {
            // if the session store shows that the user is logged in
        if(pathAuthLookup[path].role === 'guest') {
            next();
        }
        
        else if(req.session.loggedIn) {
            let isAuthorizedOnPath = (
                pathAuthLookup[path].role == 'superuser' ? 
                    (req.session.role != 'superuser' ? 
                        false :
                        true
                    ) :
                    true
            );
            if(!isAuthorizedOnPath) {
                res.status(403).send('Unauthorized Resource')
                res.end()
            } else {
                // logging the contents of the entire session store
                MyStore.all((err, session) => {
                    console.log(session)
                });
    
                next();
            }
        } else {
            res.status(403).send('Unauthorized Resource');
        };
    })
    
}
// specify which paths have user or superuser authorization
let pathAuthLookup = {
    observation: {
        role: 'guest'
    },
    coffee: {
        role: 'superuser'
    }
};
// so it's kind of like I'm repeating the routes
//     - if valid: next()
//     - if not: res.status(403)
router.get('/api/audit/observation/:feature/:include', authorize('observation'));
router.get('/api/coffee', authorize('coffee'));
*/
