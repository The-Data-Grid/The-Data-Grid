// SETUP //
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
var path = require("path");
//const port = process.env.PORT || 4001;
var httpPort;
var httpsPort;

// Deploying?
const isDeployment = process.argv[2] == '-d'

if (isDeployment) {
    httpPort = 80;
    httpsPort = 443;
} else {
    httpPort = 4001;
}
// start the main connection pool	
const {connectPostgreSQL} = require('./db/pg.js');	
connectPostgreSQL('default');

const parse = require('./parse.js');
const {validationConstructor} = require('./validate.js')
const query = require('./query.js');
const template = require('./template.js');
const authRouter = require('./auth/login.js');

app.use(cors({credentials: true, origin: 'http://localhost:4200'}));
//app.use(bodyParser.json());

// middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: false}));
app.use('/api', authRouter);

// set TLS options
let options;
if(isDeployment) {
    options = {
        key: fs.readFileSync('/etc/letsencrypt/live/thedatagrid.org/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/thedatagrid.org/fullchain.pem')
    }
};
// remove "X-Powered-By: Express" from header
app.set('x-powered-by', false);

////// ROUTES //////
//** Testing request response cycle time (for dev only) **//
function cycleTimer(req, res, next) {
    res.locals.cycleTime = []
    res.locals.cycleTime.push(Date.now())
    //console.log('app.js entry - 0 ms')
    next()
}

//** Observation Data Query **//	
app.get('/api/audit/observation/:feature/:include', parse.queryParse, validationConstructor('observation'), query.featureQuery, query.sendDefault); 	
//** Observation Distinct Query **/	
app.get('/api/audit/observation/distinct/:feature/:include', parse.queryParse, validationConstructor('observation'), query.featureQuery, query.sendDistinct)	
//** Observation Download Query **//	
app.get('/api/audit/observation/download/:downloadType/:feature/:include', parse.queryParse, validationConstructor('observation'), query.featureQuery, query.sendDefault); 	
//** Item Data Query **//	
app.get('/api/audit/item/:feature/:include', parse.queryParse, validationConstructor('item'))

//** Setup Query **//	
app.get('/api/setup', cycleTimer, parse.setupParse, query.sendSetup);	
// Audit Upload	
//app.get('/api/upload/...', parse.uploadParse, insert.insertAudit);	
// Template Query	
app.get('/api/template/', parse.templateParse, template.makeTemplate); // makeTemplate should be in query.js	
// Front Page Stats	
app.get('/api/stats/', parse.statsParse, query.statsQuery);	
// Easter Egg	
app.get('/api/coffee', (req, res) => res.status(418).send(`<center><h3><a href="https://tools.ietf.org/html/rfc2324#section-2.3.2">418 I\'m a teapot</a></h3></center><hr><center><small>&copy TDG ${new Date().getFullYear()}</small></center>`))

// Default to web app paths
app.all('/', function(req, res){
    res.sendFile(path.resolve('../Deployment/Angular/dist/index.html'));
});
app.all('*', function(req, res){
    //console.log('../Deployment/Angular/dist' + req.path);
    //console.log('../Deployment/Angular/dist' + req.path);
    res.sendFile(path.resolve('../Deployment/Angular/dist' + req.path));
});
    
////// LISTEN //////

if(isDeployment) {
    // listen with HTTPS server
    const httpsServer = https.createServer(options, app).listen(httpsPort, () => console.log(`TDG Backend Node.js HTTPS server is running on port ${httpsPort}`));
    // if deploying, create HTTP server that redirects to HTTPS with 301 status code and listen
    if (process.argv[2] == '-d') {
        const httpApp = express();
        httpApp.all('*', (req, res) => res.redirect(301, 'https://' + req.hostname + req.url));    
        const httpServer = http.createServer(httpApp).listen(httpPort, () => console.log(`TDG Backend Node.js HTTP server is running on port ${httpPort}`));
    }
}
// Then development
else {
    let port = 4001
    app.listen(port, () => console.log(`TDG Backend Node.js server is running on port ${port}`))
}
