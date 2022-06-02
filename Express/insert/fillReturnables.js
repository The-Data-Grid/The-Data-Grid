const {
    observationHistory,
    itemHistory,
    requiredItemLookup,
    returnableIDLookup,
    itemColumnObject,
} = require('../preprocess/load.js');
const fs = require('fs');

const submissionObject = JSON.parse(fs.readFileSync('submissionObject', 'utf8'));
submissionObject.items.create[0].itemTypeID = ITEM_TYPE_ID;
submissionObject.items.create[0].data.returnableIDs = [itemIDReturnableID]
