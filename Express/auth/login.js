
const express = require('express'); 
const app = express(); 
const session = require('express-session'); 

const {postgresClient} = require('../db/pg.js'); 
// get connection object
const db = postgresClient.getConnection.db
// get SQL formatter
const formatSQL = postgresClient.format;

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

    db.one(formatSQL('SELECT item_id FROM item_users WHERE name = $(user) AND password = $(password)', {
        user: combo[0], 
        password: combo[1]
    }))
    .then(data => {
        console.log('DATA:', data); 
        req.session.loggedIn = true;
        req.session.userName = req.params.user;
        res.send('you logged in');
    })
    .catch(error => {
        console.log('ERROR:', error);
        // req.session.destroy(); 
        res.send('not a valid login');
    })
});