// SETUP //
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const parse = require('./parse.js');
const query = require('./query.js');
const insert = require('./insert.js');
const template = require('./template.js');
const cors = require('cors');
const port = process.env.PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

// middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: false}));

// remove "X-Powered-By: Express" from header
app.set('x-powered-by', false);

////// ROUTES //////

// Testing request response cycle time (for dev only)
function cycleTime(req, res, next) {
    console.log('app.js entry - ' + Date.now())
    next()
}

// Data Query
app.get(cycleTime, '/api/audit/:feature/:include', parse.queryParse, query.featureQuery); 

// Audit Upload
app.get('/api/upload/...', parse.uploadParse, insert.insertAudit);

// Template Query
app.get('/api/template/', parse.templateParse, template.makeTemplate);

// Incomplete Routes
//app.get('/api/a/:include', cors());
//app.get('/api/s/filter', cors(), query.setupQuery(req, res));

////// LISTEN //////
app.listen(port, () => console.log(`Express server running on port ${port}`));
