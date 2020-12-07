
const express = require('express'); 
const router = express.Router(); //use router instead of app
const session = require('express-session'); 

const {postgresClient} = require('../db/pg.js'); 
const db = postgresClient.connect('main'); 
//const util = require

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

    db.one('SELECT * FROM users WHERE name = $1 AND password = $2', [req.body.user, req.body.pass])
    .then(data => {
        console.log('DATA:', data); 
        req.session.loggedIn = true;
        req.session.userName = req.body.user;
        res.send('you logged in');
    })
    .catch(error => {
        console.log('ERROR:', error);
        req.session.destroy(); 
        res.send('not a valid login');
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

module.exports = router; 