// We will validate the columns that can be filtered by 
const idColumnTableLookup = require('/setup.js');

// dynamically create validate object
var validate = {};

// loop through all ids in idColumnTableLookup
for (let id in idColumnTableLookup) {
    let feature = idColumnTableLookup[id].feature;

    // if empty or feature not included yet, initialize column and filter array for new feature
    if(!Object.keys(validate).includes(feature)) {
        validate[feature] = {
            column: [],
            filter: [],
            sqlType: []
        };
    }

    let idToInt = parseInt(id); // in case id isn't already an int
    validate[feature]['column'].push(idToInt);
    
    if (idColumnTableLookup[id].filterable) {
        validate[feature]['filter'].push(idToInt);
        validate[feature]['sqlType'].push(idColumnTableLookup[id].sqlType);
    }
}

module.exports = validate;