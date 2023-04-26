// Postgres connection, query execution, query formatting
const pgp = require('pg-promise')();
require('dotenv').config();
const fs = require("fs");
const isDeployment = process.argv.includes('--deploy');
console.log(isDeployment ? 'DEPLOYMENT' : 'DEVELOPMENT');

// PostgreSQL -> Javascript type parsing
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 
pgp.pg.types.setTypeParser(1184, require('./parse/parse.js').timestamptzParse) //Parsing the TIMESTAMPTZ SQL type as a JS Date

var tdgdbname = isDeployment ? process.env.PGDATABASE : 'v6';
var tdgdbuser = 'postgres';
var tdgpassword = isDeployment ? process.env.PGPASSWORD : 'postgres';
var tdghost = isDeployment ? process.env.PGHOST : 'localhost';

function logNewDatabaseConnection(connectionObject) {
    console.log('========== NEW DATABASE CONNECTION ==========')
    console.log('=============================================')
    console.log('PostgreSQL Host: ' + connectionObject.host);
    console.log('PostgreSQL Database: ' + connectionObject.database);
    console.log('PostgreSQL User: ' + connectionObject.user);
    console.log('PostgreSQL Port: ' + connectionObject.port);
    console.log('PostgreSQL Pasword: ' + (isDeployment ? '*********' : connectionObject.password));
    console.log('PostgreSQL Max Connections: ' + connectionObject.max);
    console.log('=============================================')
}

const postgresClient = {
    format: pgp.as.format,
    QueryFile: pgp.QueryFile,
    getConnection: {},
};

function connectPostgreSQL(config, options={}) {
    if('customDatabase' in options) {
        tdgdbname = options.customDatabase;
    }
    if(config == 'executive') {
        console.log(`Establishing PostgreSQL connection...`)

        // Schema construction CLI database connection
        const executiveConnection = { 
            host: tdghost,
            port: 5432,
            database: "executive",
            user: tdgdbuser,
            password: tdgpassword,
            max: 5
        };
        const db = pgp(executiveConnection);
        logNewDatabaseConnection(executiveConnection);
        postgresClient.getExecutiveConnection = db;
    } else if(config == 'default') {

        console.log(`Establishing PostgreSQL connection...`)

        // Default runtime database connection
        const defaultConnection = { //connection info
            host: tdghost,
            port: 5432,
            database: tdgdbname,
            user: tdgdbuser,
            password: tdgpassword,
            max: 10
        };
        const db = pgp(defaultConnection);
        logNewDatabaseConnection(defaultConnection);

        postgresClient.getConnection[tdgdbname] = db;        
    } else if(config == 'construct') {

        console.log(`Establishing PostgreSQL connection...`)
        // Schema construction CLI database connection
        const constructionConnection = { 
            host: tdghost,
            port: 5432,
            database: tdgdbname,
            user: tdgdbuser,
            password: tdgpassword,
            max: 1, // use only one connection
            idleTimeoutMillis: 10 // disconnect right after
        };
        const db = pgp(constructionConnection);
        logNewDatabaseConnection(defaultConnection);

        postgresClient.getConnection[tdgdbname] = db;
    } else throw Error('Must use a valid connection type: \'default\', \'construct\', \'executive\'');

    console.log("Total connected TDG databases: " + Object.keys(postgresClient.getConnection).length);
    console.log("Total connected executive databases: 1");

    // query logging
    if('streamQueryLogs' in options) {
        const logFileName = options.streamQueryLogs;
        console.log("Created query logging file");
        console.log("INFO: This database connection is logging its queries to a file. Keep in mind that this slows down performance!")
        const loggingPgPromise = new Proxy(postgresClient.getConnection[tdgdbname], {
            get: (target, propKey) => {
                const prop = target[propKey];
                if(typeof prop === 'function') {
                    // write the query synchronously to ensure correct order
                    fs.appendFileSync(logFileName, arguments[0] + ';\n');
                }
                // pass the call the pg-promise
                return Reflect.get(...arguments);
            }
        })
        postgresClient.getConnection[tdgdbname] = loggingPgPromise;
        console.log('======== LOGGING ATTACHED TO DATABASE =======');
    }
};

function disconnectPostgreSQL(dbName) {
    if(dbName in postgresClient.getConnection) {
        try {
            postgresClient.getConnection[dbName].$pool.end();
            console.log(`====== DISCONNECTED FROM DATABASE "${dbName}" ======`)
            return true;
        } catch (err) {
            console.log(`=== FAILED TO DISCONNECT FROM DATABASE "${dbName}" ===`)
            return false;
        }
    } else {
        // fail without throwing
        return false;
    }
}

module.exports = {
    postgresClient,
    connectPostgreSQL,
    disconnectPostgreSQL,
};