
const express = require('express'); 
const router = express.Router(); //use router instead of app
const session = require('express-session'); 
const bcrypt = require('bcrypt');

const {postgresClient} = require('../db/pg.js'); 

// get connection object
const db = postgresClient.getConnection.db;
// get SQL formatter
const formatSQL = postgresClient.format;

const {isValidEmail, isValidDate} = require('../validate.js');

const {apiDateToUTC} = require('../parse.js');

const SQL = require('../statement.js').login;


// session store init
let Store = require('memorystore')(session); 
let MyStore = new Store({checkPeriod: 1000000});

// Session on every route
router.use(session({
    store: MyStore, 
    secret: 'shhhhh',
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        // 1.67 hours
        maxAge: 6000000, 
        // make sure this is secure in prod
        secure: (process.env.NODE_ENV == 'development' ? false : true)
    }
}));

// Login
router.post('/login', async (req, res) => {

    let data = null;
    try {
        data = await db.one(formatSQL(SQL.password, {
            checkemail: req.body.email
        }));

        let result = await bcrypt.compare(req.body.pass, data.password); 

        if (result) {
            req.session.loggedIn = true;
            req.session.email = req.body.email;
            req.session.role = data.role
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
    if (typeof req.session.loggedIn == 'undefined') {
        res.send('you already logged out.');
    } 
    else {
        req.session.destroy();
        res.send('you just logged out!'); 
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