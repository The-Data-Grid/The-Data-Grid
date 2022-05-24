/*
    For manually inserting a submission with a submissionObject JSON file that is on-device
*/
const { connectPostgreSQL } = require('../pg.js');
connectPostgreSQL('default'); // Establish an new connection pool
const { insertSubmission } = require('./router.js');
const fs = require('fs');

let submissionObject = fs.readFileSync(__dirname + '/submissionObject.json', 'utf-8');
submissionObject = JSON.parse(submissionObject);

const sessionObject = {
    privilege: 'user',
    role: [2],
    organizationID: [1],
    userID: 1,
}

insertSubmission(submissionObject, sessionObject);