// Postgres connection, query execution, query formatting
const pgp = require('pg-promise')();
require('dotenv').config();
const fs = require("fs");
const isDeployment = process.argv.includes('--deploy');
console.log(isDeployment ? 'DEPLOYMENT' : 'DEVELOPMENT');
const child = require("child_process");
const { parentDir } = require("./utils.js");

// PostgreSQL -> Javascript type parsing
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 
pgp.pg.types.setTypeParser(1184, require('./parse/parse.js').timestamptzParse) //Parsing the TIMESTAMPTZ SQL type as a JS Date

const TDG_DB_NAME = isDeployment ? process.env.PGDATABASE : 'v6';
const TDG_DB_USER = 'postgres';
const TDG_DB_PASSWORD = isDeployment ? process.env.PGPASSWORD : 'postgres';
const TDG_HOST = isDeployment ? process.env.PGHOST : 'localhost';
const TDG_PORT = 5432;

function logNewDatabaseConnection(connectionObject, logConnection) {
    if(logConnection) {
        console.log('========== NEW DATABASE CONNECTION ==========')
        console.log('=============================================')
        console.log('PostgreSQL Host: ' + (isDeployment ? '*********' : connectionObject.host));
        console.log('PostgreSQL Database: ' + connectionObject.database);
        console.log('PostgreSQL User: ' + connectionObject.user);
        console.log('PostgreSQL Port: ' + connectionObject.port);
        console.log('PostgreSQL Pasword: ' + (isDeployment ? '*********' : connectionObject.password));
        console.log('PostgreSQL Max Connections: ' + connectionObject.max);
        console.log('=============================================')
    }
}

const postgresClient = {
    format: pgp.as.format,
    importSql: (fileName) => new pgp.QueryFile(`${parentDir(__dirname)}/PostgreSQL/${fileName}`),
    getConnection: {},
};

function connectPostgreSQL(config, options={ log: true }) {
    let tdgdbname = TDG_DB_NAME;
    if('customDatabase' in options) {
        tdgdbname = options.customDatabase;
    }
    if(config == 'executive') {
        console.log(`Establishing PostgreSQL connection...`)

        // Schema construction CLI database connection
        const executiveConnection = { 
            host: TDG_HOST,
            port: TDG_PORT,
            database: "executive",
            user: TDG_DB_USER,
            password: TDG_DB_PASSWORD,
            max: 5,
            idleTimeoutMillis: 10 // disconnect right after
        };
        const db = pgp(executiveConnection);
        logNewDatabaseConnection(executiveConnection, options.log);
        postgresClient.getExecutiveConnection = db;
    } else if(config == 'default') {

        console.log(`Establishing PostgreSQL connection...`)

        // Default runtime database connection
        const defaultConnection = { //connection info
            host: TDG_HOST,
            port: TDG_PORT,
            database: tdgdbname,
            user: TDG_DB_USER,
            password: TDG_DB_PASSWORD,
            max: 10
        };
        const db = pgp(defaultConnection);
        logNewDatabaseConnection(defaultConnection, options.log);

        postgresClient.getConnection[tdgdbname] = db;        
    } else if(config == 'construct') {

        console.log(`Establishing PostgreSQL connection...`)
        // Schema construction CLI database connection
        const constructionConnection = { 
            host: TDG_HOST,
            port: TDG_PORT,
            database: tdgdbname,
            user: TDG_DB_USER,
            password: TDG_DB_PASSWORD,
            max: 1, // use only one connection
            idleTimeoutMillis: 10 // disconnect right after
        };
        const db = pgp(constructionConnection);
        logNewDatabaseConnection(constructionConnection, options.log);

        postgresClient.getConnection[tdgdbname] = db;
    } else throw Error('Must use a valid connection type: \'default\', \'construct\', \'executive\'');

    console.log("Total connected TDG databases: " + Object.keys(postgresClient.getConnection).length);
    console.log("Total connected executive databases: 1");

    // query logging
    if('streamQueryLogs' in options) {
        /*
        This doesn't work right now. The pg-promise methods are read-only so the proxy has to return its actual value
        and thus doesn't have access to the arguments

        const logFileName = options.streamQueryLogs;
        console.log("Created query logging file");
        console.log("INFO: This database connection is logging its queries to a file. Keep in mind that this slows down performance!")
        const nonLoggingPgPromise = postgresClient.getConnection[tdgdbname];

        function loggingPgPromise(obj) {
            const handler = {
                get: (target, propKey) => {
                    const parentMethod = target[propKey];
                    return function(...args) {
                        if(typeof parentMethod === "function") {
                            // write the query to file synchronously to ensure correct order
                            fs.appendFileSync(logFileName, args[0] + ';\n');
                        }
                        // pass the call the pg-promise
                        return parentMethod.apply(target, args);
                    }
                }
            };
            return new Proxy(obj, handler);
        }
        postgresClient.getConnection[tdgdbname] = loggingPgPromise(nonLoggingPgPromise);
        console.log('======== LOGGING ATTACHED TO DATABASE =======');
        */
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

async function psqlProcess(dbName, fileName, streamLogsCallback) {
    const psqlParams = [
        "-U",
        TDG_DB_USER,
        "-d",
        dbName,
        "-h",
        TDG_HOST,
        "-p",
        TDG_PORT,
        "-f",
        parentDir(__dirname) + "/PostgreSQL/" + fileName
    ];
    return new Promise((resolve, reject) => {
        const psql = child.execFile("psql", psqlParams, (err, stdout, stderr) => {
            resolve([err, stdout, stderr]);
        });

        if(streamLogsCallback) {
            // capture logs
            psql.stdout.on("data", (data) => {
                streamLogsCallback(data);
            });
        }
    });
}

module.exports = {
    postgresClient,
    connectPostgreSQL,
    disconnectPostgreSQL,
    psqlProcess,
};