// ============================================================
// Functionality has been moved to a preprocessing step (preprocess.js) which
// writes a JSON file with all the internal objects right before the API starts
// ============================================================

const fs = require('fs');

const internalObjects = JSON.parse(fs.readFileSync('./internalObjects.json'));

module.exports = internalObjects;

