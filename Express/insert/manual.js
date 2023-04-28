/*
    For manually inserting a submission with a submissionObject JSON file that is on-device
*/

// Database connection
let postgresdb = process.argv.filter(arg => /--postgresdb=.*/.test(arg));
let schemaName = process.argv.filter(arg => /--schema=.*/.test(arg));
let dbFolderName = process.argv.filter(arg => /--dbFolderName=.*/.test(arg));
let streamQueryLogsFileName = process.argv.filter(arg => /--streamQueryLogs=.*/.test(arg));
if(schemaName.length == 0 || dbFolderName.length == 0) {
    throw Error('--dbFolderName=... or --schema=... not set');
}
schemaName = schemaName[0].slice(9);
dbFolderName = dbFolderName[0].slice(15);
const { connectPostgreSQL, postgresClient } = require('../pg.js');
const databaseOptions = {
    log: false,
};
if(postgresdb.length > 0) {
    postgresdb = postgresdb[0].slice(13);
    databaseOptions.customDatabase = postgresdb;
} else {
    throw Error("Must include database to connect to with --postgresdb=...");
}	
if(streamQueryLogsFileName.length > 0) {
    streamQueryLogsFileName = streamQueryLogsFileName[0].slice(18);
    databaseOptions.streamQueryLogs = streamQueryLogsFileName;
}	
connectPostgreSQL('construct', databaseOptions);
const insertionDb = postgresClient.getConnection[databaseOptions.customDatabase];

const { insertSubmission } = require('./router.js');
const fs = require('fs');

console.log(`Inserting submissionObject into the database...`)
let submissionObject = fs.readFileSync(`${dbFolderName}/${schemaName}/submissions/submissionObject.json`, 'utf-8');
submissionObject = JSON.parse(submissionObject);
const sessionObject = {
    privilege: 'user',
    role: [2],
    organizationID: [1],
    userID: 1,
}
insertSubmission(submissionObject, sessionObject, insertionDb, databaseOptions.customDatabase);