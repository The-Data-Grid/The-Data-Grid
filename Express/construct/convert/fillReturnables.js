const {
    observationHistory,
    itemHistory,
    requiredItemLookup,
    returnableIDLookup,
    itemColumnObject,
} = require('../../preprocess/load.js');
const fs = require('fs');

const submissionObject = JSON.parse(fs.readFileSync(__dirname + '/outputObjects/submissionObject1.json', 'utf8'));
const returnableView = JSON.parse(fs.readFileSync(parentDir(__dirname, 2) + '/schemaAssets/returnableView.json'));
const allItems = JSON.parse(fs.readFileSync(parentDir(__dirname, 2) + '/schemaAssets/allItems.json'));

let featureTableName;
let itemTableName;
for(let arg of process.argv) {
    if(/--featureName=.*/.test(arg)) {
        featureTableName = 'observation_' + arg.slice(14).toLowerCase().split(' ').join('_');
        itemTableName = 'item_' + arg.slice(14).toLowerCase().split(' ').join('_');
        break;
    }
}

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

submissionObject.items.create[0].itemTypeID = dataMap.itemTypeID;
submissionObject.items.create[0].data.returnableIDs = [dataMap.itemIDReturnableID];

for(let n = 0; n < submissionObject.observations.create.length; n++) {
    submissionObject.observations.create[n].itemTypeID = dataMap.itemTypeID;
    console.log(submissionObject.observations.create[n].data.returnableIDs)
    submissionObject.observations.create[n].data.returnableIDs = submissionObject.observations.create[n].data.returnableIDs.map(name => dataMap.returnableLookup[name]);
}

fs.writeFileSync(__dirname + '/outputObjects/submissionObject.json', JSON.stringify(submissionObject));

function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}