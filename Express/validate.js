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

console.log(validate)

let validateFeatures = Object.keys(validate);

//// Validate request feature, columns, and filters ////

function validateAudit(req, res, next) {

    let feature = 'feature_' + res.locals.parsed.features;

    if(!validateFeatures.includes(feature)) {
        return res.status(400).send(`Bad Request 2201: ${feature} is not a valid feature`);
    };

    // Validate columns for feature

    for(let column of res.locals.parsed.columns) {
        if(!validate[feature]['column'].includes(parseInt(column))) {
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
            let operator = res.locals.parsed.filters[filter]['operation'];
            let field = res.locals.parsed.filters[filter]['value'];

            if(validate[feature]['sqlType'][index] === 'TEXT') {

                if(operator != '=' && operator != 'Exists' && operator != 'Does not exist') {
                    return res.status(400).send(`Bad Request 2204: ${operator} is not a valid operator for the ${filter} filter`);
                }

                if(!isText(field)) {
                    return res.status(400).send(`Bad Request 1604: Field for id: ${filter} must be text`);
                }

            } else if(validate[feature]['sqlType'][index] === 'NUMERIC') {

                if(!isNumber(field)) {
                    return res.status(400).send(`Bad Request 1605: Field for id: ${filter} must be numeric`);
                }

            } else if(validate[feature]['sqlType'[index] === 'DATE']) {

                if(!isValidDate(field)) {
                    return res.status(400).send(`Bad Request 1606: Field for id: ${filter} must be date`);
                }

            }
        }
        index++;
    };

    // Passing to query.js
    next();
}

function isText(field) {
    if(!/^[a-zA-Z]+$/.test(field)) {
        return false;
    }
    return true;
}

function isNumber(field) {
    if(!/^[1-9]+$/.test(field)) {
        return false;
    }
    return true;
}

function isValidDate(field)
{
    var matches = /^(\d{1,2})[-](\d{1,2})[-](\d{4})$/.exec(field);
    if (matches == null) return false;
    var d = matches[2];
    var m = matches[1] - 1;
    var y = matches[3];
    var composedDate = new Date(y, m, d);
    return composedDate.getDate() == d &&
            composedDate.getMonth() == m &&
            composedDate.getFullYear() == y;
}

module.exports = {
    validateAudit
};