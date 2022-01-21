// DATABASE CONNECTION AND QUERY //
// ============================================================
// We need to query the metadata tables at the beginning of each session to get data for the setup object,
// querying, upload, and more. Everything that queries the metadata tables to recieve this information
// should go here and then the other files can import the information
// ============================================================

const fs = require('fs');

const internalObjects = JSON.parse(fs.readFileSync('./internalObjects.json'));

module.exports = internalObjects;

