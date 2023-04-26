// Executive Node.js process which manages TDG instances by doing the following:
// - Create new databases
// - Delete databases

const express = require('express');
const app = express();
// SQL Formatter
const { postgresClient, connectPostgreSQL } = require('../pg.js');
const { getConnection } = postgresClient;
const { nanoid } = require('nanoid');

async function createNewDatabase(locals) {
    const {
        databaseConnection,
        dbName,
        dbSqlName,
        dbLogFileName,
        hasValidDbApiKey,
    } = locals;
    // "executive" database connection
    let db = databaseConnection;
    const rand = nanoid(50);
    const isTemp = !hasValidDbApiKey;
    // Insert into exec
    await db.none(`
        INSERT INTO item_database_executive
        (data_database_name, data_database_sql_name, data_claim_code, data_is_temp)
        VALUES
        ($(dbName), $(dbSqlName), $(rand), $(isTemp))
    `, {
        dbName,
        dbSqlName,
        rand,
        isTemp,
    });
    // Create DB
    await db.none("CREATE DATABASE $(dbSqlName)", { dbSqlName });
    // Make new connection
    connectPostgreSQL("construct", { customDatabase: dbSqlName, streamQueryLogs: dbLogFileName });
    const newlyCreatedDbConnection = getConnection[dbSqlName];
    // Run V6
    const v6 = postgresClient.QueryFile(parentDir(__dirname) + "/PostgreSQL/V6.sql")
    await newlyCreatedDbConnection.none(v6);
    return rand;
}

async function checkDatabaseNameIsValid(locals) {
    const {
        databaseConnection,
        dbName,
        dbSqlName,
    } = locals;
    // "executive" database connection
    let db = databaseConnection;
    // First, make sure that the database isn't called "executive" as that would collide
    if(dbSqlName === "executive") {
        return false;
    }
    // Check exec
    try {
        await db.none(`
            SELECT * FROM item_database_executive
            WHERE data_database_name = $(dbName)
            OR data_database_sql_name = $(dbSqlName)
        `, {
            dbName,
            dbSqlName,
        });

        // query has run successfully and we are sure there are no matches
        return true;
    } catch(err) {
        // either query has failed or there is a match
        return false;
    }
}

async function cleanUpFailedDatabaseGeneration(cleanupObject) {
    if("cleanFiles" in cleanupObject) {
        try {
            // Careful!
            fs.rmSync(cleanupObject.cleanFiles, { recursive: true, force: true });
            console.log("CLEANED UP FILES");
        } catch(err) {
            console.log("FAILED TO CLEANUP FILES");
        }
    }
    if("cleanDatabase" in cleanupObject) {
        try {
            const { dbName, executiveDatabaseConnection } = cleanupObject.cleanDatabase;
            // Make sure all connections to database are closed
            disconnectPostgreSQL(dbName);
            // Drop database
            const db = executiveDatabaseConnection;
            await db.none("DROP DATABASE $(dbName)", { dbName });
            console.log("CLEANED UP DATABASE");
        } catch(err) {
            console.log("FAILED TO CLEANUP DATABASE");
        }
    }
}

function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}

async function allDatabases(req, res, next) {
    try {
        // Get databases in PostgreSQL
        const db = res.locals.executiveDatabaseConnection;
        const postgresDbArray = await db.any(`
            SELECT 
                data_database_name "dbName",
                data_database_sql_name "dbSqlName",
                data_is_temp "isTemp"
                FROM item_database_executive
        `);
        // Get databases currently being served by Node.js
        for(let dbObj of postgresDbArray) {
            dbObj.isBeingServed = dbObj.dbSqlName in getConnection;
        }
        return res.status(200).json(postgresDbArray);
    } catch(err) {
        console.log(err);
        return res.status(500).end();
    }
}

module.exports = {
    // Middleware
    allDatabases,
    // Helpers
    createNewDatabase,
    checkDatabaseNameIsValid,
    cleanUpFailedDatabaseGeneration,
};