
/********************
        SETUP      
 ********************/

const fs = require('fs')
const Joi = require('joi');

const allInternalObjects = require('../preprocess/load.js');
const allIdValidationLookups = {}
for(let keyVal of Object.entries(allInternalObjects)) {
    const { internalObjects } = keyVal[1]
    allIdValidationLookups[keyVal[0]] = internalObjects;
}

/*
    'text',
    'decimal',
    'wholeNumber',
    'date',
    'checkbox',
    'checkboxList',
    'dropdown',
    'geoPoint',
    'geoLine',
    'geoRegion'
*/
const validOperatorLookup = {
    'text': [
        'equals', 'textContainsCase', 'textContainsNoCase' 
    ],
    'decimal': [
        'equals', 'lessOrEqual', 'less', 'greater', 'greaterOrEqual'
    ],
    'wholeNumber': [
        'equals', 'lessOrEqual', 'less', 'greater', 'greaterOrEqual'
    ],
    'date': [
        'equals', 'lessOrEqual', 'less', 'greater', 'greaterOrEqual'
    ],
    'checkbox': [
        'equals'
    ],
    'checkboxList': [
        'contains', 'containedBy', 'overlaps'
    ],
    'dropdown': [
        'equals'
    ],
    'geoPoint': ['geoContains', 'geoCrosses', 'geoDisjoint', 'geoWithinDistance', 'geoEquals', 'geoIntersects', 'geoTouches', 'geoOverlaps', 'geoWithin'],
    'geoLine': ['geoContains', 'geoCrosses', 'geoDisjoint', 'geoWithinDistance', 'geoEquals', 'geoIntersects', 'geoTouches', 'geoOverlaps', 'geoWithin'],
    'geoRegion': ['geoContains', 'geoCrosses', 'geoDisjoint', 'geoWithinDistance', 'geoEquals', 'geoIntersects', 'geoTouches', 'geoOverlaps', 'geoWithin']
};

/*
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
                referenceType in item-id, item-non-id, item-list, item-factor, attribute (current)
        valid returnableIDs to filter
        sql type of filterable returnableIDs

validItems:
    Array of valid items (just the keys of validateItem)

*/



var globals = {
    filter: [],
    column: []
};

// Validity objects for every database
let allValidateObservation = {};
let allValidateItem = {};
let allValidFeatures = {};
let allValidItems = {};

for(let dbName in allIdValidationLookups) {
    const idValidationLookup = allIdValidationLookups[dbName];
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
                sqlType: [],
                selectorType: [],
            };
        }
    
        let idToInt = parseInt(id); // in case id isn't already an int
        currentValidator[currentBase].column.push(idToInt);
        
        if (idValidationLookup[id].isFilterable) {
            currentValidator[currentBase].filter.push(idToInt);
            currentValidator[currentBase].sqlType.push(idValidationLookup[id].sqlType);
            currentValidator[currentBase].selectorType.push(idValidationLookup[id].selectorType);
        }
    }
    
    let validFeatures = Object.keys(validateObservation);
    let validItems = Object.keys(validateItem);

    // attach to database-wide objects
    allValidateObservation[dbName] = validateObservation;
    allValidateItem[dbName] =  validateItem;
    allValidFeatures[dbName] = validFeatures;
    allValidItems[dbName] =  validItems;
}


// Returns a validation middleware function depending on the initialization parameters
function validationConstructor(init) {
    // if item use item validation objects
    if(init == 'item') {
        return itemOrObservation(allValidateItem, null, allValidItems)
    // if observation use observation object
    } else if(init == 'observation') {
        return itemOrObservation(allValidateObservation, globals, allValidFeatures)
    // else throw
    } else {
        throw Error('Invalid validationConstructor initialization');
    }
    
    function itemOrObservation(validate, globals, validateFeatures) {

        //// Validate request feature, columns, and filters ////
        return (req, res, next) => {
            const dbName = res.locals.databaseConnectionName;
            validate = validate[dbName];
            validateFeatures = validateFeatures[dbName];
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
            for(let filter of res.locals.parsed.filters) {
                // if not a valid filter for this feature and not a global filter and feature validation
                console.log(validate[feature].filter)
                if(!validate[feature].filter.includes(parseInt(filter.id)) && (init == 'item' || !globals.filter.includes(parseInt(filter.id)))) { 
                    return res.status(400).send(`Bad Request 2203: ${filter.id} is not a valid filter for the ${feature} feature`);
                } else {
                    let operator = filter.op;
                    let field = filter.val;
                    let index = validate[feature].filter.indexOf(filter.id)

                    const filterIndex = validate[feature].filter.indexOf(parseInt(filter.id));

                    // Operator validation
                    if(!validOperatorLookup[validate[feature].selectorType[filterIndex]].includes(operator)) {
                        return res.status(400).send(`Bad Request 2222: ${operator} is not a valid operator for the ${filter.id} filter`);
                    }

                    // GeoJSON validation
                    if(['geoPoint', 'geoLine', 'geoRegion'].includes(validate[feature].selectorType[filterIndex])) {
                        try {
                            let parsedGeoJSON = JSON.parse(field);
                            // If in {type: Feature, geometry: {...}} format then just take the geometry
                            if('geometry' in parsedGeoJSON) {
                                filter.val = JSON.stringify(parsedGeoJSON.geometry);
                            }
                        } catch(err) {
                            console.log(err)
                            return res.status(400).end(`Bad Request 2223: Invalid GeoJSON passed for the ${filter.id} filter`);
                        }
                    }

                    // TODO: proper type validation
                    /*
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

                    // NUMERIC
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
                    */
                }
            };

            var filters = Object.keys(universalFilters);
            // Validate universalFilters query
            if(filters.includes('sorta') && filters.includes('sortd')) {
                return res.status(400).send(`Bad Request 2206: Cannot use both sorta and sortd`);
            } else if(filters.includes('offset') && (!filters.includes('sorta') && !filters.includes('sortd'))) {
                // Commented out because there is always an implicit sort added internally if the user doesn't supply one
                //return res.status(400).send(`Bad Request 2207: Offset requires either sorta or sortd`);
            } else if(filters.includes('limit') && !filters.includes('offset')) {
                return res.status(400).send(`Bad Request 2208: Limit requires offset`);
            }

            // Validate universalFilters input fields
            for(let filter in universalFilters) {
                console.log(filter, universalFilters[filter])
                // Validate field
                if (filter == 'limit' && !isPositiveInteger(universalFilters[filter])) {
                    return res.status(400).send(`Bad Request 2210: Field for ${filter} must be a positive integer`);
                } else if (filter == 'offset' && !isPositiveIntegerOrZero(universalFilters[filter])) {
                    return res.status(400).send(`Bad Request 2209: Field for ${filter} must be zero or a positive integer`);
                } else if (filter == 'sorta' || filter == 'sortd') {
                    if (!validate[feature].column.includes(parseInt(universalFilters[filter])) && (init == 'item' || !globals.filter.includes(parseInt(universalFilters[filter])))) {
                        return res.status(400).send(`Bad Request 2211: Field for ${filter} must be a valid returnable ID`);
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

function isValidDate(field) {
    const matches = /^(\d{1,2})[-](\d{1,2})[-](\d{4})$/.exec(field);
    if (matches == null) return false;
    let d = matches[2];
    let m = matches[1] - 1;
    let y = matches[3];
    let composedDate = new Date(y, m, d);
    return composedDate.getDate() == d &&
            composedDate.getMonth() == m &&
            composedDate.getFullYear() == y;
}

function dateToUTC(field) {
    const matches = /^(\d{1,2})[-](\d{1,2})[-](\d{4})$/.exec(field);
    let d = matches[2];
    let m = matches[1] - 1;
    let y = matches[3];
    const dateString = new Date(y, m, d);
    return dateString.toUTCString();
}

function isPositiveIntegerOrZero(field) {
    var n = Math.floor(Number(field));
    return n !== Infinity && String(n) == field && n >= 0;
}

function isPositiveInteger(field) {
    var n = Math.floor(Number(field));
    return n !== Infinity && String(n) == field && n > 0;
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
    dateToUTC,
    isValidEmail,
    isValidPassword,
    requestObject: {
        updateUserObject,
        setRoleObject
    }
};
