// SETUP //
// Deploying?
const isDeployment = ['-d', '--deploy'].includes(process.argv[2])
// Testing?
const isTesting = ['-t', '--test'].includes(process.argv[2])

const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
let httpPort;
let httpsPort;
if (isDeployment) {
    httpPort = 80;
    httpsPort = 443;
} else {
    httpPort = 4001;
}

// start the main connection pool	
const {connectPostgreSQL} = require('./db/pg.js');	
connectPostgreSQL('default');

// Middleware
const { setupParse } = require('./parse.js');
const { sendSetup, sendMobileSetup, sendFilterSetup } = require('./query/query.js');
const insertRouter = require('./insert/router.js');
const auditRouter = require('./query/router.js');
const authRouter = require('./auth/router.js');
const managementRouter = require('./manage/router.js');
const setSession = require('./auth/session.js');
const parseCredentials = require('./auth/parseCredentials.js');
const { generateSpreadsheet } = require('./spreadsheet/generate.js')

// CORS, JSON, URL encoding
app.use(cors({
    credentials: true,
    origin: 'http://localhost:4200'
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false}));

// Security headers
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
// require TLS for production
app.use(isDeployment ? helmet.hsts() : (req, res, next) => next());

// Session and format request authorization credentials
app.use('/api', setSession, parseCredentials)

// User Management API Router
app.use('/api/user', authRouter);

// Audit Upload API Router
app.use('/api/audit/submission', insertRouter);

// Audit API Router
app.use('/api/audit', auditRouter);

// Setup Object
app.get('/api/setup', setupParse, sendSetup);

// Setup Mobile Object
app.get('/api/setup/mobile', setupParse, sendMobileSetup);

// Filter Setup Object
app.get('/api/setup/filter', setupParse, sendFilterSetup);

// Audit and Organization management router
app.use('/api/manage', managementRouter);

app.get('/api/spreadsheet/generate', generateSpreadsheet);

// @kian pls clean up

// //Default to web app paths
// app.all('/', function(req, res){
//     res.sendFile(path.resolve('../Deployment/Angular/dist/index.html'));
// });
// app.all('*', function(req, res){
//     //console.log('../Deployment/Angular/dist' + req.path);
//     //console.log('../Deployment/Angular/dist' + req.path);
//     res.sendFile(path.resolve('../Deployment/Angular/dist' + req.path));
// });

app.get('/', function(req,res){
    res.sendFile(path.resolve('../Deployment/Angular/dist/index.html'));
});

app.all('/dist/*', function(req, res){
    //console.log('../Deployment/Angular/dist' + req.path);
    //console.log(req.path);
    //console.log('../Deployment/Angular/dist' + path.join(req.path.split(path.sep).slice(1)));
    //req.path.split(path.sep)
    //console.log(req.path.split(path.sep).slice(1))
    //path.join(req.path.split(path.sep).slice(1))
    //req.path.substring(req.path.indexOf(path.sep));
    res.sendFile(path.resolve('../Deployment/Angular' + req.path));
});

////// LISTEN //////

if(isDeployment) {
    // set TLS options
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/thedatagrid.org/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/thedatagrid.org/fullchain.pem')
    }
    // listen with HTTPS server
    const httpsServer = https.createServer(options, app).listen(httpsPort, () => console.log(`TDG Backend Node.js HTTPS server is running on port ${httpsPort}`));
    // if deploying, create HTTP server that redirects to HTTPS with 301 status code and listen
    if (process.argv[2] == '-d') {
        const httpApp = express();
        httpApp.all('*', (req, res) => res.redirect(301, 'https://' + req.hostname + req.url));    
        const httpServer = http.createServer(httpApp).listen(httpPort, () => console.log(`TDG Backend Node.js HTTP server is running on port ${httpPort}`));
    }
}
// Testing?
else if(isTesting) {
    // export the app to the tester
    module.exports = app
}
// Then development
else {
    app.listen(httpPort, () => console.log(`TDG Backend Node.js server is running on port ${httpPort}`));
}
