
/********************
        SETUP      
 ********************/

const fs = require('fs')
const Joi = require('joi')

const {idValidationLookup} = require('./setup.js');

try {
    featureItemLookup = JSON.parse(fs.readFileSync(`${__dirname}/dataRepresentation/schemaAssets/featureItemLookup.json`))
    allItems = JSON.parse(fs.readFileSync(`${__dirname}/dataRepresentation/schemaAssets/allItems.json`))
} catch(err) {
    throw Error('Error reading schema assets. Have you constructed the schema yet? Use `npm run construct -- make-schema ...` or `bash ./Express/db/init.sh`')
}

let a = Object.values(idValidationLookup).map(e => [e.feature, e.baseItem])
// console.log([...new Set(a.map(e => e[0] + ' ' + e[1]))])

/*
Below is a bunch of generated validation objects which are used in the middleware function below. Validation
is different for the observation query and the item query

*************
** Imports **
*************
idValidationLookup:
    Contains every returnableID and some values for each:
        rootFeature
        feature // null if item returnable
        item
        referenceType
        isFilterable
        isGlobal
        sqlType
        baseItem // null if feature returnable

featureItemLookup:
    Contains every feature and its respective item

allItems
    Contains every item

******************
** Observation ***
******************
validateObservation:
    Contains every feature and some values for each:
        valid returnableIDs to query
        valid returnableIDs to filter by
        sql type of filterable returnableIDs

globals:
    Contains every global returnableID:
        filterable global returnableIDs
        column returnableIDs

validFeatures
    Array of valid features (just the keys of validateObservation)

**********
** Item **
********** 
validateItem:
    Contains every item and some values for each:
        valid returnableIDs to query
            valid for _item_ if:
                referenceType in item-id, item-non-id, item-list, item-factor, item-location, attribute (current)
        valid returnableIDs to filter
        sql type of filterable returnableIDs

validItems:
    Array of valid items (just the keys of validateItem)

*/



var globals = {
    filter: [],
    column: []
};

let validateObservation = {};
let validateItem = {};

for (let id in idValidationLookup) { 
    if (idValidationLookup[id].isGlobal === true) {
        globals.column.push(parseInt(id));
        if(idValidationLookup[id].isFilterable === true) {
            globals.filter.push(parseInt(id));
        };
    };
};

// Dynamically generating validateObservation by
// looping through all ids in idValidationLookup
for (let id in idValidationLookup) {
    let baseItem = idValidationLookup[id].baseItem
    // feature or item returnable ?
    let currentValidator, currentBase;
    if(baseItem === null) {
        currentValidator = validateObservation
        currentBase = (idValidationLookup[id].rootfeature === null ? idValidationLookup[id].feature : idValidationLookup[id].rootfeature)
    } else {
        currentValidator = validateItem
        currentBase = baseItem
    }

    // if empty or not included yet, initialize column and filter array for new feature
    // we can do this because currentValidator is a pointer
    if(!(currentBase in currentValidator)) {
        currentValidator[currentBase] = {
    // // Getting the root feature
    // let feature = (idValidationLookup[id].rootfeature === null ? idValidationLookup[id].feature : idValidationLookup[id].rootfeature)
    
    // // if empty or feature not included yet, initialize column and filter array for new feature
    // if(!Object.keys(validateObservation).includes(feature)) {
    //     validateObservation[feature] = {
            column: [],
            filter: [],
            sqlType: []
        };
    }

    let idToInt = parseInt(id); // in case id isn't already an int
    currentValidator[currentBase].column.push(idToInt);
    
    if (idValidationLookup[id].isFilterable) {
        currentValidator[currentBase].filter.push(idToInt);
        currentValidator[currentBase].sqlType.push(idValidationLookup[id].sqlType);
    }
}

let validFeatures = Object.keys(validateObservation);
let validItems = Object.keys(validateItem);


/********************/
//console.log(featureItemLookup);

//console.log('idValidationLookup', idValidationLookup);
//console.log('validate', validateObservation)
//console.log('globals', globals);
//console.log('validateFeatures', validFeatures);








// Returns a validation middleware function depending on the initialization parameters
function validationConstructor(init) {
 
    // if item use item validation objects
    if(init == 'item') {

        return itemOrObservation(validateItem, null, validItems)

    // if observation use observation object
    } else if(init == 'observation') {

        return itemOrObservation(validateObservation, globals, validFeatures)

    // else throw
    } else {

        throw Error('Invalid validationConstructor initialization');

    }
    

    function itemOrObservation(validate, globals, validateFeatures) {

        //// Validate request feature, columns, and filters ////
        return (req, res, next) => {

            // item_... or obs_... depending on endpoint
            let feature = (init == 'item' ? 'item_' + res.locals.parsed.features : 'observation_' + res.locals.parsed.features);
            let universalFilters = res.locals.parsed.universalFilters;


            if(!validateFeatures.includes(feature)) {
                return res.status(400).send(`Bad Request 2201: ${feature} is not a valid ${init == 'item' ? 'item' : 'feature'}`);
            };

            // Validate columns for feature

            for(let column of res.locals.parsed.columns) {
                if(!validate[feature].column.includes(parseInt(column)) && (init == 'item' || !globals.column.includes(parseInt(column)))) {
                    return res.status(400).send(`Bad Request 2202: ${column} is not a valid column for the ${feature} feature`);
                };
            };

            // Validate filters for feature and operators for filters

            let filterIDKeys = Object.keys(res.locals.parsed.filters);    

            for(let filter of filterIDKeys) {
                // if not a valid filter for this feature and not a global filter and feature validation
                if(!validate[feature].filter.includes(parseInt(filter)) && (init == 'item' || !globals.filter.includes(parseInt(filter)))) { 
                    return res.status(400).send(`Bad Request 2203: ${filter} is not a valid filter for the ${feature} feature`);
                } else {
                    let operator = res.locals.parsed.filters[filter]['operation'];
                    let field = res.locals.parsed.filters[filter]['value'];
                    let index = validate[feature].filter.indexOf(filter)

                    // TEXT
                    if(validate[feature]['sqlType'][index] == 'TEXT') {
                        if(operator != '=' && operator != '~') {
                            return res.status(400).send(`Bad Request 2204: ${operator} is not a valid operator for the ${filter} filter`);
                        }
                        for(let item of field) {
                            if(!isText(item)) {
                                return res.status(400).send(`Bad Request 1604: Field for id: ${filter} must be text`);
                            }
                        }

                    // NUMBER
                    } else if(validate[feature]['sqlType'][index] == 'NUMERIC') {
                        for(let item of field) {
                            if(!isNumber(item)) {
                                return res.status(400).send(`Bad Request 1605: Field for id: ${filter} must be numeric`);
                            }
                        }

                    // DATE
                    } else if(validate[feature]['sqlType'][index] == 'TIMESTAMPTZ') {
                        for(let item of field) {
                            if(!isValidDate(item)) {
                                return res.status(400).send(`Bad Request 1606: Field for id: ${filter} must be a valid date in mm-dd-yyyy format`);
                            }
                        }
                    }
                }
            };

            var filters = Object.keys(universalFilters);
            // Validate universalFilters query
            if(filters.includes('sorta') && filters.includes('sortd')) {
                return res.status(400).send(`Bad Request 2206: Cannot use both sorta and sortd`);
            } else if(filters.includes('offset') && (!filters.includes('sorta') && !filters.includes('sortd'))) {
                return res.status(400).send(`Bad Request 2207: Offset requires either sorta or sortd`);
            } else if(filters.includes('limit') && !filters.includes('offset')) {
                return res.status(400).send(`Bad Request 2208: Limit requires offset`);
            }

            // Validate universalFilters input fields
            for(let filter in universalFilters) {
                // Validate field
                if(Array.isArray(universalFilters[filter])) {
                    return res.status(400).send(`Bad Request 2205: Cannot have duplicate filters`);
                } else if (filter == 'limit' && !isPositiveInteger(universalFilters[filter])) {
                    return res.status(400).send(`Bad Request 2210: Field for ${filter} must be a positive integer`);
                } else if (filter == 'offset' && !isPositiveIntegerOrZero(universalFilters[filter])) {
                    return res.status(400).send(`Bad Request 2209: Field for ${filter} must be zero or a positive integer`);
                } else if (filter == 'sorta' || filter == 'sortd') {
                    if (!validate[feature].column.includes(parseInt(universalFilters[filter])) && (init == 'item' || !globals.filter.includes(parseInt(universalFilters[filter])))) {
                        return res.status(400).send(`Bad Request 2210: Field for ${filter} must be a positive integer`);
                    }
                } else if (filter == 'pk') {
                    if (filter == 'pk' && !isPositiveInteger(universalFilters[filter])) {
                        return res.status(400).send(`Bad Request 2210: Field for ${filter} must be a positive integer`);
                    }
                }
            }

            // Passing to query.js            
            next();
        }

    }

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

function isValidEmail(email) {
    if(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(email)) {
        return true
    } else {
        return false
    }
}

function isValidPassword(password) {
    if (password.length < 10 || 
        !(/[a-zA-Z]/g.test(password)) || 
        !(/\d/.test(password)))
        return false;
    return true; 
}

async function updateUserObject(req, res, next) {
    // define the object
    const obj = Joi.object({
        "firstName": Joi.string().allow(undefined),
        "lastName": Joi.string().allow(undefined),
        "email": Joi.string().allow(undefined),
        "dateOfBirth": Joi.string().allow(undefined), //in MM-DD-YYYY format
        "isEmailPublic": Joi.boolean().allow(undefined),
        "isQuarterlyUpdates": Joi.boolean().allow(undefined)     
    })

    // validate on it
    const { error } = await obj.validateAsync(req.body)
    if(error) {
        return res.status(400).send('Bad Request 3700: Request Object invalid')
    }

    next()
}

async function setRoleObject(req, res, next) {
    // define the object
    const obj = Joi.object({
        "organizationID": Joi.number().integer(),
        "userID": Joi.number().integer(),
        "role": Joi.allow('auditor', 'admin') // 'auditor' or 'admin'     
    })

    // validate on it
    const { error } = await obj.validateAsync(req.body)
    if(error) {
        return res.status(400).send('Bad Request 3700: Request Object invalid')
    }

    next()
}

module.exports = {
    validateObservation: validationConstructor('observation'),
    validateItem: validationConstructor('item'),
    hasDuplicates,
    isText,
    isNumber,
    isValidDate,
    isValidEmail,
    isValidPassword,
    requestObject: {
        updateUserObject,
        setRoleObject
    }
};
