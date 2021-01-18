
const express = require('express'); 
const router = express.Router(); //use router instead of app
const session = require('express-session'); 
const bcrypt = require('bcrypt');

const {postgresClient, connectPostgreSQL} = require('../db/pg.js'); 

// get connection object
const db = postgresClient.getConnection.db;
// get SQL formatter
const formatSQL = postgresClient.format;

// session store init
let Store = require('memorystore')(session); 
let MyStore = new Store({checkPeriod: 1000000});

router.use(session({
    store: MyStore, 
    secret: 'shhhhh',
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        maxAge: 60000, 
    }
}));

router.post('/login/', (req, res) => {
    let combo = [req.body.user, req.body.pass];
    //console.log(req.body); 

    db.one(formatSQL('SELECT password FROM users WHERE name = $(user)', {
        user: combo[0]
    }))
    .then(data => {
        //console.log('password = ' + data.password);
        //console.log('combo[1] = ' + combo[1]); 
        let result = bcrypt.compareSync(combo[1], data.password); 
        //compare the unhashed password with the hashed password in the database using the bcrypt compareSync function
        if (result) {
            req.session.loggedIn = true;
            req.session.userName = req.body.user;
            req.session.role = data.role
            res.send('password matched and you logged in');
        }
        else {
            res.status(401).send('password did not match');
        }
    })
    .catch(error => {
        console.log('ERROR:', error);
        // req.session.destroy(); 
        res.status(401).send('not a valid login');
    })
});

router.get('/secure', (req, res) => {
    // if the session store shows that the user is logged in
    if(req.session.loggedIn) {
        res.send(`Here is your confidential data, ${req.session.userName}`);

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

router.post('/logout/', (req, res) => {
    if (typeof req.session.loggedIn == 'undefined') {
        res.send('you already logged out.');
    } 
    else {
        req.session.destroy();
        res.send('you just logged out!'); 
    }
});

module.exports = router