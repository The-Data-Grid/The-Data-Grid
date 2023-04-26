// ============================================================
// Functionality has been moved to a preprocessing step (preprocess.js) which
// writes a JSON file with all the internal objects right before the server starts
// ============================================================

const fs = require('fs');

const allInternalObjects = {};

// collect internalObjects from every database
const dbFolders = fs.readdirSync(parentDir(__dirname, 2) + "/Schemas", { withFileTypes: true });
const dbFoldersTemp = fs.readdirSync(parentDir(__dirname, 2) + "/TempSchemas", { withFileTypes: true });
// Permenant
for(let dbFolder of dbFolders) {
    if(dbFolder.isDirectory() && dbFolder.name !== "_exampleSchema" && dbFolder.name !== "_globalSchema") {
        allInternalObjects[dbFolder.name] = JSON.parse(fs.readFileSync(parentDir(__dirname) + "/Schemas/" + dbFolder.name + "/internalObjects/internalObjects.json"));
    }
}
// Temp
for(let dbFolder of dbFoldersTemp) {
    if(dbFolder.isDirectory()) {
        allInternalObjects[dbFolder.name] = JSON.parse(fs.readFileSync(parentDir(__dirname) + "/TempSchemas/" + dbFolder.name + "/internalObjects/internalObjects.json"));
    }
}

function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}

console.log("Loaded internalObjects from " + (dbFolders.length - 2 + dbFoldersTemp.length) + " databases");
module.exports = allInternalObjects;