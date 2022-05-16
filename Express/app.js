// SETUP //
// Deploying?
const isDeployment = ['-d', '--deploy'].includes(process.argv[2])
// Testing?
const isTesting = ['-t', '--test'].includes(process.argv[2])

const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
let httpPort;
let httpsPort;
if (isDeployment) {
    httpPort = 80;
    httpsPort = 8080;
} else {
    httpPort = 4001;
}

// start the main connection pool	
const {connectPostgreSQL} = require('./pg.js');	
connectPostgreSQL('default');

// Middleware
const { setupParse } = require('./parse/parse.js');
const { sendSetup, sendMobileSetup, sendFilterSetup } = require('./query/query.js');
const insertRouter = require('./insert/router.js');
const auditRouter = require('./query/router.js');
const authRouter = require('./auth/router.js');
//const managementRouter = require('./manage/router.js');
const setSession = require('./auth/session.js');
const parseCredentials = require('./auth/parseCredentials.js');

// CORS, JSON, URL encoding
app.use(cors({
    credentials: true,
    origin: isDeployment ? 'https://www.thedatagrid.org' : 'http://localhost:4200'
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false}));

// Trust the deployment reverse proxy
if(isDeployment) {
    app.set('trust proxy', true);
}


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
app.use('/', setSession, parseCredentials)

// User Management API Router
app.use('/user', authRouter);

// Audit Upload API Router
app.use('/audit/submission', insertRouter);

// Audit API Router
app.use('/audit', auditRouter);

// Setup Object
app.get('/setup', setupParse, sendSetup);

// Setup Mobile Object
app.get('/setup/mobile', setupParse, sendMobileSetup);

// Filter Setup Object
app.get('/setup/filter', setupParse, sendFilterSetup);

// Audit and Organization management router
//app.use('/manage', managementRouter);

// Route not found
app.use('*', (req, res) => res.status(404).end());

////// LISTEN //////

if(isDeployment) {
    app.listen(httpsPort, () => console.log(`TDG Backend Node.js server is running on port ${httpsPort}`));
}
else if(isTesting) {
    // export the app to the tester
    module.exports = app
}
// Then development
else {
    app.listen(httpPort, () => console.log(`TDG Backend Node.js server is running on port ${httpPort}`));
}
