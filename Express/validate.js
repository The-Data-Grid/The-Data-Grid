const {idColumnTableLookup} = require('./setup.js');

// Dynamically generating the validate object by
// looping through all ids in idColumnTableLookup

var validate = {};

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

let validateFeatures = Object.keys(validate);

//// Validate request feature, columns, and filters ////

function validateAudit(req, res, next) {

    let feature = res.locals.parsed.features;

    // Validate feature
    if(!validateFeatures.includes(feature)) {
        return res.status(400).send(`Bad Request 2201: ${feature} is not a valid feature`);
    };

    // Validate columns for feature
    for(let column of res.locals.parsed.columns) {
        if(!validate[feature]['column'].includes(column)) {
            return res.status(400).send(`Bad Request 2202: ${column} is not a valid column for the ${feature} feature`);
        };
    };
    
    // Validate filters for feature and operators for filters

    let index = 0;
    let filterIDKeys = Object.keys(res.locals.parsed.filters);

    for(let filter of filterIDKeys) {
        if(!validate[feature]['filter'].includes(filter)) { 
            return res.status(400).send(`Bad Request 2203: ${filter} is not a valid filter for the ${feature} feature`);
        } else {

            // operator validation, which is only done on filterable columns
            let operator = res.locals.parsed.filters[filter]['operation']; // find operator associated with filter (id), using res.locals.parsed.filters (which is now the entire filter object)
            if(validate[feature]['sqlType'][index] === 'TEXT') { // case where type is text. If numeric, it will always be valid
                if(operator != '=' && operator != 'Exists' && operator != 'Does not exist') {
                    return res.status(400).send(`Bad Request 2204: ${operator} is not a valid operator for the ${filter} filter`);
                }
            }
        }
        index++;
    };

    // Passing to query.js
    next();
}                                          


module.exports = {
    validateAudit
};