// Executive Node.js process which manages TDG instances

const fs = require("fs");
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
// SQL Formatter
const { postgresClient, connectPostgreSQL, disconnectPostgreSQL, psqlProcess } = require('../pg.js');
const { getConnection } = postgresClient;
const V6UserSql = postgresClient.importSql("V6_user.sql");

async function createNewDatabase(res) {
    const {
        executiveDatabaseConnection,
        dbName,
        dbSqlName,
        dbLogFileName,
        hasValidDbApiKey,
        genType,
    } = res.locals;
    // "executive" database connection
    let db = executiveDatabaseConnection;
    const claimCode = nanoid(30);
    const isTemp = !hasValidDbApiKey;
    // Insert into exec
    await db.none(`
        INSERT INTO item_database_executive
        (data_database_name, data_database_sql_name, data_claim_code, data_is_temp)
        VALUES
        ($(dbName), $(dbSqlName), $(claimCode), $(isTemp))
    `, {
        dbName,
        dbSqlName,
        claimCode,
        isTemp,
    });
    // Create DB
    await db.none("CREATE DATABASE $(dbSqlName:name)", { dbSqlName });
    // Make new connection and get the connection object
    connectPostgreSQL("construct", { customDatabase: dbSqlName, streamQueryLogs: dbLogFileName, log: false });
    const newlyCreatedDatabase = postgresClient.getConnection[dbSqlName];
    // Run V6 via psql commandline
    await psqlProcess(dbSqlName, "V6.sql", (data) => {
        res.write(data);
    });
    // Generate a single user, organization, audit, and global item
    // Generate a password so the user can log into their database
    const userPassword = nanoid(15);
    const hashedPassword = await bcrypt.hash(userPassword, 13); 
    await newlyCreatedDatabase.none(V6UserSql, {
        hashedPassword,
        auditName: `Database generated with ${genType} pipeline`,
    });

    return {
        claimCode,
        userPassword,
    };  
}

async function checkDatabaseNameIsValid(locals) {
    const {
        executiveDatabaseConnection,
        dbName,
        dbSqlName,
    } = locals;
    // "executive" database connection
    let db = executiveDatabaseConnection;
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
        console.log(err)
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
            console.log(err);
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
            await db.none("DROP DATABASE IF EXISTS $(dbName:name)", { dbName });
            // Remove database from executive
            await db.none(`
                DELETE FROM item_database_executive
                WHERE data_database_sql_name = $(dbName)
            `, { dbName });
            console.log("CLEANED UP DATABASE");
        } catch(err) {
            console.log(err);
            console.log("FAILED TO CLEANUP DATABASE");
        }
    }
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