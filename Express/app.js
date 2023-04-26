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

// Start the main connection pool for each database
const { connectPostgreSQL, postgresClient } = require('./pg.js');
const { getConnection } = postgresClient;
let database = process.argv.filter(arg => /--database=.*/.test(arg));
if(database.length > 0) {
    database = postgresdb[0].slice(13).split(",");
    for(let databaseName of database) {
        connectPostgreSQL('default', { customDatabase: databaseName });
    }
} else {
    console.log("Starting service without any TDG databases");
}
// Start the executive database connection
connectPostgreSQL('executive');

// Middleware Router
const mainRouter = require('./router.js');

// Attach which database is being queried
function attachDatabaseToRequest(req, res, next) {
    let databaseName = req.params.dbName;
    if(databaseName in getConnection) {
        res.locals.databaseConnection = getConnection[databaseName];
        res.locals.databaseConnectionName = databaseName;
        return next();
    } else {
        return res.status(400).end("Must specify database in request");
    }
}

// Executive calls
const executiveDatabase = require("./executive/router.js");

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

// Executive requests like create new db, delete db, check all databases
app.use('/executive', executiveDatabase);

// Core TDG router 
app.use('/db/:dbName', attachDatabaseToRequest, mainRouter);

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