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
// Start the executive database connection
connectPostgreSQL('executive');
// Get the connection objects
const { getConnection, getExecutiveConnection } = postgresClient;
// Import the internal objects for every database
const allInternalObjects = require('./preprocess/load.js');
// Import the executive file for database pruning
const { pruneTempDatabases } = require('./executive/executive.js');

let passedDatabase = process.argv.filter(arg => /--database=.*/.test(arg));
const startAllDatabases = process.argv.some(arg => arg === "--all-databases");
const isNoPruningMode = process.argv.some(arg => arg === "--no-prune");
const deleteFolderOnMismatch = process.argv.some(arg => arg === "--delete-folder-on-mismatch");
const deleteRowOnMismatch = process.argv.some(arg => arg === "--delete-row-on-mismatch");
if(startAllDatabases) {
    if(!isNoPruningMode) {
        pruneTempDatabases({
            allInternalObjects,
            db: getExecutiveConnection,
            deleteFolderOnMismatch,
            deleteRowOnMismatch,
        }, (validDatabases) => {
            // Connect to every database after invalid databases have been pruned
            for(let databaseName of validDatabases) {
                connectPostgreSQL('default', { customDatabase: databaseName, log: true });
            }
            console.log(`Connected to ${validDatabases.length} database${validDatabases.length === 1 ? "" : "s"}`);
        });
    } else {
        // Connect to every database immediately
        for(let databaseName in allInternalObjects) {
            connectPostgreSQL('default', { customDatabase: databaseName, log: true });
        }
        console.log(`Skipped pruning and connected to ${Object.keys(allInternalObjects).length} database${Object.keys(allInternalObjects).length === 1 ? "" : "s"}`);
    }
} else if(passedDatabase.length > 0) {
    passedDatabase = passedDatabase[0].slice(11).split(",");
    for(let databaseName of passedDatabase) {
        connectPostgreSQL('default', { customDatabase: databaseName, log: true });
    }
    console.log(`Skipped pruning and connected to ${passedDatabase.length} database${passedDatabase.length === 1 ? "" : "s"}`);
} else {
    console.log("Starting service without any TDG databases");
}

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