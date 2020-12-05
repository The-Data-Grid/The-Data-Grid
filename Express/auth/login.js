
const express = require('express'); 
const app = express(); 
const session = require('express-session'); 

const postgresClient = require('./db/pg.js'); 
const db = postgresClient.connect('main'); 
//const util = require

// session store init
let Store = require('memorystore')(session); 
let MyStore = new Store({checkPeriod: 1000000});

app.use(session({
    store: MyStore, 
    secret: 'shhhhh',
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        maxAge: 60000, 
    }
}));

app.post('/login/', (req, res) => {
    let combo = [req.body.user, req.body.pass];

    db.one('SELECT * FROM users WHERE name = $1 AND password = $2', req.body.user, req.body.pass)
    .then(data => {
        console.log('DATA:', data); 
        req.session.loggedIn = true;
        req.session.userName = req.params.user;
        res.send('you logged in');
    })
    .catch(error => {
        console.log('ERROR:', error);
        req.session.destroy(); 
        res.send('not a valid login');
    })
});