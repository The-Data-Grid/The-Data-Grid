// SETUP //
const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
var path = require("path");
//const port = process.env.PORT || 4001;
var httpPort;
var httpsPort;

// Deploying?
const isDeployment = ['-d', '--deploy'].includes(process.argv[2])
// Testing?
const isTesting = ['-t', '--test'].includes(process.argv[2])

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
const {validateObservation, validateItem} = require('./validate.js')
const query = require('./query/query.js');
const insert = require('./insert/insert.js');
const cacheLayer = require('./query/cacheLayer.js');
const template = require('./template.js');
const authRouter = require('./auth/login.js');

// CORS
app.use(cors({
    credentials: true,
    origin: 'http://localhost:4200'
}));

// middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: false}));

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

// User Management Router
app.use('/api/user', authRouter);

////// ROUTES //////

//** Observation Key Query **/	
app.get('/api/audit/observation/key/:feature', 
    parse.keyQueryParse, 
    validateObservation, 
    query.featureQuery, 
    query.sendKey);

//** Observation Data Query **//	
app.get('/api/audit/observation/:feature/:include',
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateObservation, 
    query.featureQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDefault);

//** Observation Data Query w/ Download **//	
app.get('/api/audit/download/:downloadType/observation/:feature/:include',
    cacheLayer.hitCacheDownload, 
    parse.queryParse, 
    validateObservation, 
    query.featureQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDownload);

//** Observation Distinct Query **/	
app.get('/api/audit/observation/distinct/:feature/:include',
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateObservation, 
    query.featureQuery, 
    query.formatDistinct,
    cacheLayer.setCache,
    query.sendDistinct);


//** Item Key Query **//	
app.get('/api/audit/item/key/:feature', 
    parse.keyQueryParse, 
    validateItem, 
    query.itemQuery, 
    query.sendKey);

//** Item Data Query **//	
app.get('/api/audit/item/:feature/:include',
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateItem, 
    query.itemQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDefault);

//** Item Data Query w/ Download **//	
app.get('/api/audit/download/:downloadType/item/:feature/:include',
    cacheLayer.hitCacheDownload,
    parse.queryParse, 
    validateItem, 
    query.itemQuery, 
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDownload);

//** Item Distinct Query **//	
app.get('/api/audit/item/distinct/:feature/:include', 
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateItem, 
    query.itemQuery, 
    query.formatDistinct,
    cacheLayer.setCache,
    query.sendDistinct);


//** Setup Query **//	
app.get('/api/setup', parse.setupParse, query.sendSetup);	
// Audit Upload	
app.post('/api/audit/submission', insert.submission);	
// Template Query	
app.get('/api/template/', parse.templateParse, template.makeTemplate); // makeTemplate should be in query.js	
// Front Page Stats	
app.get('/api/stats/', parse.statsParse, query.statsQuery);	
// Easter Egg	
app.get('/api/coffee', (req, res) => res.status(418).send(`<center><h3><a href="https://tools.ietf.org/html/rfc2324#section-2.3.2">418 I\'m a teapot</a></h3></center><hr><center><small>&copy TDG ${new Date().getFullYear()}</small></center>`))

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
    let port = 4001
    app.listen(port, () => console.log(`TDG Backend Node.js server is running on port ${port}`))
}
