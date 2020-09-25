const {idColumnTableLookup, returnableIDLookup} = require('./setup.js');

// Generate array of ids that are global
var globals = [];

for (let id in returnableIDLookup) {
    if (returnableIDLookup[id].returnType == "global") {
        globals.push(id);
    }
}

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

    let feature = 'feature_' + res.locals.parsed.features;
    let universalFilters = res.locals.parsed.universalFilters;

    if(!validateFeatures.includes(feature)) {
        return res.status(400).send(`Bad Request 2201: ${feature} is not a valid feature`);
    };

    // Validate columns for feature

    for(let column of res.locals.parsed.columns) {
        if(!validate[feature]['column'].includes(parseInt(column)) && !globals.includes(parseInt(column))) {
            return res.status(400).send(`Bad Request 2202: ${column} is not a valid column for the ${feature} feature`);
        };
    };
    
    // Validate filters for feature and operators for filters

    let index = 0;
    let filterIDKeys = Object.keys(res.locals.parsed.filters);

    for(let filter of filterIDKeys) {
        if(!validate[feature]['filter'].includes(parseInt(filter))) { 
            return res.status(400).send(`Bad Request 2203: ${filter} is not a valid filter for the ${feature} feature`);
        } else {
            let operator = res.locals.parsed.filters[filter]['operation'];
            let field = res.locals.parsed.filters[filter]['value'];

            if(validate[feature]['sqlType'][index] === 'TEXT') {
                if(operator != '=' && operator != 'Exists' && operator != 'Does not exist') {
                    return res.status(400).send(`Bad Request 2204: ${operator} is not a valid operator for the ${filter} filter`);
                }
                field.forEach(function(item) {
                    if(!isText(item)) {
                        return res.status(400).send(`Bad Request 1604: Field for id: ${filter} must be text`);
                    }
                });
            } else if(validate[feature]['sqlType'][index] === 'NUMERIC') {
                field.forEach(function(item) {
                    if(!isNumber(item)) {
                        return res.status(400).send(`Bad Request 1605: Field for id: ${filter} must be numeric`);
                    }
                });
            } else if(validate[feature]['sqlType'[index] === 'DATE']) {
                field.forEach(function(item) {
                    if(!isValidDate(item)) {
                        return res.status(400).send(`Bad Request 1606: Field for id: ${filter} must be date`);
                    }
                });
            }
        }
        index++;
    };

    var filters = Object.keys(universalFilters);
    // Validate universalFilters query
    if (hasDuplicates(filters)) {
        return res.status(400).send(`Bad Request 2205: Cannot have duplicate filters.`);
    } else if(filters.includes('sorta') && filters.includes('sortd')) {
        return res.status(400).send(`Bad Request 2206: Cannot use both sorta and sortd.`);
    } else if(filters.includes('offset') && (!filters.includes('sorta') && !filters.includes('sortd'))) {
        return res.status(400).send(`Bad Request 2207: Offset requires either sorta or sortd.`);
    } else if(filters.includes('limit') && !filters.includes('offset')) {
        return res.status(400).send(`Bad Request 2208: Limit requires offset.`);
    }

    // Validate universalFilters input fields
    for(let filter of filters) {
        // Validate field
        if (filter == 'limit' && !isPositiveIntegerOrZero(universalFilters[filter])) {
            return res.status(400).send(`Bad Request 2209: Field for ${filter} must be zero or a postiive integer.`);
        } else if (filter == 'offset' && !isPositiveInteger(universalFilters[filter])) {
            return res.status(400).send(`Bad Request 2210: Field for ${filter} must be a postiive integer.`);
        } else if (filter == 'sorta' || filter == 'sortd') {
            if (!validate[feature]['column'].includes(parseInt(universalFilters[filter])) && !globals.includes(parseInt(universalFilters[filter]))) {
                return res.status(400).send(`Bad Request 2210: Field for ${filter} must be a positive integer.`);
            }
        }
    }

    // Passing to query.js
    next();
}

//// Helper validation functions ////

function hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
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

function isPositiveIntegerOrZero(field) {
    var n = Math.floor(Number(field));
    return n !== Infinity && String(n) === field && n >= 0;
}

function isPositiveInteger(field) {
    var n = Math.floor(Number(field));
    return n !== Infinity && String(n) === field && n > 0;
}

module.exports = {
    validateAudit
};