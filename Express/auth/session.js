require('dotenv').config();
const session = require('express-session'); 

// session store init
let Store = require('memorystore')(session); 
let MyStore = new Store({checkPeriod: 1_000_000});

// Session on every route
module.exports = session({
    store: MyStore, 
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        // 1 week
        maxAge: 604_800_000, 
        // make sure this is secure in prod
        secure: (process.env.NODE_ENV == 'development' ? false : true)
    }
});