require('dotenv').config();
const session = require('express-session'); 
const isDeployment = process.argv.some(e => ['-d', '--deploy'].includes(e));

// session store init
let Store = require('memorystore')(session); 
let MyStore = new Store({checkPeriod: 1_000_000});

// Session on every route
module.exports = session({
    store: MyStore, 
    secret: isDeployment ? process.env.EXPRESS_SESSION_SECRET : 'no-secret',
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        // 1 month
        maxAge: 2_628_000_000, 
        // make sure this is secure in prod
        secure: isDeployment ? true : false,
    }
});