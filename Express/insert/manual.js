/*
    For manually inserting a submission with a submissionObject JSON file that is on-device
*/

// Database connection
let postgresdb = process.argv.filter(arg => /--postgresdb=.*/.test(arg));
let schemaName = process.argv.filter(arg => /--schema=.*/.test(arg));
let database = process.argv.filter(arg => /--database=.*/.test(arg));
if(schemaName.length == 0 || database.length == 0) {
    throw Error('--database=... or --schema=... not set');
}
schemaName = schemaName[0].slice(9);
database = database[0].slice(11);
const { connectPostgreSQL } = require('../pg.js');
if(postgresdb.length == 0) {
    connectPostgreSQL('default');
} else {
    postgresdb = postgresdb[0].slice(13);
    connectPostgreSQL('default', { customDatabase: postgresdb });
}	

const { insertSubmission } = require('./router.js');
const fs = require('fs');

let submissionObject = fs.readFileSync(parentDir(__dirname, 2) + `/Schemas/${database}/${schemaName}/submissionObject.json`, 'utf-8');
submissionObject = JSON.parse(submissionObject);

const sessionObject = {
    privilege: 'user',
    role: [2],
    organizationID: [1],
    userID: 1,
}

insertSubmission(submissionObject, sessionObject);

function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}