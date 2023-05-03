// ============================================================
// Functionality has been moved to a preprocessing step (preprocess.js) which
// writes a JSON file with all the internal objects right before the server starts
// ============================================================

const fs = require('fs');
const { parentDir } = require("../utils.js");

const allInternalObjects = {};

// collect internalObjects from every database
const dbFolders = fs.readdirSync(parentDir(__dirname, 2) + "/Schemas", { withFileTypes: true });
const dbFoldersTemp = fs.readdirSync(parentDir(__dirname, 2) + "/TempSchemas", { withFileTypes: true });
// Permenant
for(let dbFolder of dbFolders) {
    if(dbFolder.isDirectory() && dbFolder.name !== "_exampleSchema" && dbFolder.name !== "_globalSchema") {
        const folderName = parentDir(__dirname, 2) + "/Schemas/" + dbFolder.name;
        allInternalObjects[dbFolder.name] = {
            internalObjects: JSON.parse(fs.readFileSync(folderName + "/_internalObjects/internalObjects.json")),
            folderName,
            isTemp: false,
        };
    }
}
// Temp
for(let dbFolder of dbFoldersTemp) {
    if(dbFolder.isDirectory()) {
        const folderName = parentDir(__dirname, 2) + "/TempSchemas/" + dbFolder.name;
        allInternalObjects[dbFolder.name] = {
            internalObjects: JSON.parse(fs.readFileSync(folderName + "/_internalObjects/internalObjects.json")),
            folderName,
            isTemp: true,
        };
    }
}

const nDatabases = dbFolders.length - 2 + dbFoldersTemp.length
console.log("Loaded internalObjects from " + nDatabases + " database" + (nDatabases > 1 ? "s" : ""));
module.exports = allInternalObjects;