const express = require('express');
const app = express();
const session = require('express-session');
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

let valid = [['bob','password'], ['oliver','pass']];


app.get('/login/:user/:pass', (req, res) => {
    let combo = [req.params.user, req.params.pass];

    // if a valid login (authenticated) then store that session is logged in and session user name
    if(valid.map(el => el.join('>')).includes(combo.join('>'))) {
        req.session.loggedIn = true;
        req.session.userName = req.params.user;
        res.send('you logged in');
    } else {
    // then remove the current session
        req.session.destroy()
        res.send('not a valid login');
    }
});

app.get('/secure', (req, res) => {
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

app.listen(9090, () => console.log('server started!'))