// 
const fs = require('fs');

let featureTableName;
let itemTableName;
let dbFolderName;
let schema;
for(let arg of process.argv) {
    if(/--featureName=.*/.test(arg)) {
        featureTableName = 'observation_' + arg.slice(14).toLowerCase().split(' ').join('_');
        itemTableName = 'item_' + arg.slice(14).toLowerCase().split(' ').join('_');
    } else if(/--dbFolderName=.*/.test(arg)) {
        dbFolderName = arg.slice(15);
    } else if(/--schema=.*/.test(arg)) {
        schema = arg.slice(9);
    }
}

// 1. Get entire database metadata objects
const returnableView = JSON.parse(fs.readFileSync(dbFolderName + '/internalObjects/returnableView.json'));
const allItems = JSON.parse(fs.readFileSync(dbFolderName + '/internalObjects/allItems.json'));

const dataMap = {
    returnableLookup: {}
};
for(let returnable of returnableView) {
    if(returnable.f__table_name == featureTableName) {
        dataMap.returnableLookup[returnable.r__frontend_name] = returnable.r__returnable_id;
    } else if(returnable.i__table_name == itemTableName) {
        dataMap.itemIDReturnableID = returnable.r__returnable_id;
    } 
}
dataMap.itemTypeID = allItems.filter(item => item.i__table_name == itemTableName)[0].i__item_id - 1;

// 2. For each submission object, add the necessary returnables
fs.mkdirSync(`${dbFolderName}/${schema}/submissions`);
const fileNames = fs.readdirSync(`${dbFolderName}/${schema}/submissionsWithoutReturnables`);
for(let i = 0; i < fileNames.length; i++) {
    const submissionObject = JSON.parse(fs.readFileSync(`${dbFolderName}/${schema}/submissionsWithoutReturnables/${fileNames[i]}`, 'utf8'));
    submissionObject.items.create[0].itemTypeID = dataMap.itemTypeID;
    submissionObject.items.create[0].data.returnableIDs = [dataMap.itemIDReturnableID];
    
    for(let n = 0; n < submissionObject.observations.create.length; n++) {
        submissionObject.observations.create[n].itemTypeID = dataMap.itemTypeID;
        console.log(submissionObject.observations.create[n].data.returnableIDs)
        submissionObject.observations.create[n].data.returnableIDs = submissionObject.observations.create[n].data.returnableIDs.map(name => dataMap.returnableLookup[name]);
    }
    
    fs.writeFileSync(`${dbFolderName}/${schema}/submissions/submissionObject_${i}.json`, JSON.stringify(submissionObject));
}
// Remove the old submission object folder
fs.rmSync(`${dbFolderName}/${schema}/submissionsWithoutReturnables`, { recursive: true, force: true });
