// Executive Node.js process which manages TDG instances

const fs = require("fs");
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
// Time before deletion of temp database, also need to change in SQL in `pruneTempDatabases()`
const DATABASE_VALIDITY_WINDOW = 3600000; // 1 hour
// SQL Formatter
const { postgresClient, connectPostgreSQL, disconnectPostgreSQL, psqlProcess } = require('../pg.js');
const { getConnection, importSql } = postgresClient;
const V6UserSql = importSql("V6_user.sql");

async function createNewDatabase(res) {
    const {
        executiveDatabaseConnection,
        dbName,
        dbSqlName,
        dbLogFileName,
        hasValidDbApiKey,
        genType,
        dbTempDirName,
    } = res.locals;
    // "executive" database connection
    let db = executiveDatabaseConnection;
    const isTemp = !hasValidDbApiKey;
    // Insert into exec
    await db.none(`
        INSERT INTO item_database_executive
        (data_database_name, data_database_sql_name, data_is_temp)
        VALUES
        ($(dbName), $(dbSqlName), $(isTemp))
    `, {
        dbName,
        dbSqlName,
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

    const generationFlowObject = {
        userPassword,
        userEmail: "user-generated@thedatagrid.org" // Hardcoded because it's the same for all generated DBs
    };

    // Set the deletion timer
    if(isTemp) {
        const deletionTimer = setTimeout(() => {
            cleanUpDatabaseGeneration({
                cleanFiles: dbTempDirName,
                cleanDatabase: {
                    dbName: dbSqlName,
                    executiveDatabaseConnection: executiveDatabaseConnection
                }
            });
        }, DATABASE_VALIDITY_WINDOW); // 1 hour
        generationFlowObject.deletionTimer = deletionTimer;
    } else {
        generationFlowObject.deletionTimer = null;
    }

    return generationFlowObject;  
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

async function checkApiKeyIsValid(db, key) {
    try {
        await db.one(`
            SELECT * FROM db_api_key
            WHERE data_key = $(key)
        `, { key });

        return true;
    } catch(err) {
        return false;
    }
}

async function cleanUpDatabaseGeneration(cleanupObject) {
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
    if("deletionTimer" in cleanupObject && cleanupObject.deletionTimer !== null) {
        clearTimeout(cleanupObject.deletionTimer);
    }
}

async function pruneTempDatabases(options, connectionCallback) {
    const {
        allInternalObjects,
        db,
        deleteFolderOnMismatch,
        deleteRowOnMismatch,
    } = options;
    const validDatabases = [];
    const invalidDatabases = [];
    // DATABASE_VALIDITY_WINDOW is hardcoded into SQL after `INTERVAL`
    const databaseValidityObject = Object.fromEntries((await db.many(`
        SELECT data_database_sql_name "dbSqlName", data_is_temp "isTemp", data_time_created + INTERVAL '1 hour' > NOW() "isTimeValid"
        FROM item_database_executive
    `)).map(e => [e.dbSqlName, e]));
    // The allInternalObjects array which is defined by the /TempSchemas and /Schemas file structure should match up with the table of databases
    for(let databaseName in allInternalObjects) {
        const isTempByFileStructure = allInternalObjects[databaseName].isTemp;
        // check if database is temp and is past the deletion deadline 
        if(databaseName in databaseValidityObject) {
            const dbObject = databaseValidityObject[databaseName];
            if(dbObject.isTemp && !dbObject.isTimeValid) {
                // Sanity check to make sure that the file structure agrees with isTemp
                if(!isTempByFileStructure) {
                    throw Error("Attempted to delete database that is inside `/TempSchemas` because it is marked as temporary in the executive database. Rectify this before restarting the server!");
                }
                invalidDatabases.push(databaseName);
            } else {
                // Either non-temp or is within the validity window
                validDatabases.push(databaseName);
            }
        } else {
            // Mismatch 1 handling: databases that are in the folder structure but not in the executive table
            if(!deleteFolderOnMismatch) {
                throw Error(`Database "${databaseName}" is inside ${isTempByFileStructure ? '`/TempSchemas`' : '`/Schemas`'} but is not a row in the executive database.
                Either rectify this manually or pass \`--delete-folder-on-mismatch\` on startup to delete the folder automatically`);
            }
            invalidDatabases.push(databaseName);
        }
    }
    // Mismatch 2 handling: databases that are in the table but not in the folder structure
    for(let databaseName in databaseValidityObject) {
        if(!(databaseName in allInternalObjects)) {
            if(!deleteRowOnMismatch) {
                throw Error(`Database "${databaseName}" is a row in the executive database but isn't inside \`/TempSchemas\` or \`/Schemas\`.
                Either rectify this manually or pass \`--delete-row-on-mismatch\` on startup to delete the row automatically`);
            }
            invalidDatabases.push(databaseName);
        }
    }

    // Delete invalid databases
    for(let databaseName of invalidDatabases) {
        // Do this syncronously because interpretability is more important than startup time 
        await cleanUpDatabaseGeneration({
            cleanFiles: allInternalObjects[databaseName].folderName,
            cleanDatabase: {
                dbName: databaseName,
                executiveDatabaseConnection: db
            }
        });
        // Remove from memory
        delete allInternalObjects[databaseName];
    }
    console.log(`Pruned ${invalidDatabases.length} no longer valid database${invalidDatabases.length === 1 ? "" : "s"}`);

    // Connecting to the valid databases
    connectionCallback(validDatabases);
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
    cleanUpDatabaseGeneration,
    checkApiKeyIsValid,
    pruneTempDatabases,
};