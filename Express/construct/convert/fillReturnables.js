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
const returnableView = JSON.parse(fs.readFileSync(dbFolderName + '/_internalObjects/returnableView.json'));
const allItems = JSON.parse(fs.readFileSync(dbFolderName + '/_internalObjects/allItems.json'));

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

// 2. Add the necessary returnables to the submissionObject
const submissionObject = JSON.parse(fs.readFileSync(`${dbFolderName}/${schema}/submissions/submissionObjectWithoutReturnables.json`, 'utf8'));
submissionObject.items.create[0].itemTypeID = dataMap.itemTypeID;
submissionObject.items.create[0].data.returnableIDs = [dataMap.itemIDReturnableID];

for(let n = 0; n < submissionObject.observations.create.length; n++) {
    submissionObject.observations.create[n].itemTypeID = dataMap.itemTypeID;
    // console.log(submissionObject.observations.create[n].data.returnableIDs)
    submissionObject.observations.create[n].data.returnableIDs = submissionObject.observations.create[n].data.returnableIDs.map(name => dataMap.returnableLookup[name]);
}

fs.writeFileSync(`${dbFolderName}/${schema}/submissions/submissionObject.json`, JSON.stringify(submissionObject));