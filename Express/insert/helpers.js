/**
 * Insertion helper functions
 */
const {
    observationHistory,
    itemHistory,
    requiredItemLookup,
    returnableIDLookup,
    itemColumnObject,
} = require('../preprocess/load.js');
const {
    isValidDate,
    dateToUTC,
} = require('../parse/validate.js');
const type = require('@melgrove/type');
const {postgresClient} = require('../pg.js');
const formatSQL = postgresClient.format;

class CreateItemError extends Error {
    constructor(errObject, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CreateItemError)
      }
  
      this.name = 'CreateItemError'
      // Custom debugging information
      this.code = errObject.code
      this.msg = errObject.msg
      this.message = `\n\n|========================= ${this.name}\n\nCode: ${this.code}\nMsg: ${this.msg}\n\n|========================= STACK TRACE\n${this.message}`;
    }
}

class CreateObservationError extends Error {
    constructor(errObject, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
    
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CreateObservationError);
        }
    
        this.name = 'CreateItemError';
        // Custom debugging information
        this.code = errObject.code;
        this.msg = errObject.msg;
        this.message = `\n\n|========================= ${this.name}\n\nCode: ${this.code}\nMsg: ${this.msg}\n\n|========================= STACK TRACE\n${this.message}`;
    }
}

class DeleteObservationError extends Error {
    constructor(errObject, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
    
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DeleteObservationError);
        }
    
        this.name = 'DeleteObservationError';
        // Custom debugging information
        this.code = errObject.code;
        this.msg = errObject.msg;
        this.message = `\n\n|========================= ${this.name}\n\nCode: ${this.code}\nMsg: ${this.msg}\n\n|========================= STACK TRACE\n${this.message}`;
    }
}

class DeleteItemError extends Error {
    constructor(errObject, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
    
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DeleteItemError);
        }
    
        this.name = 'DeleteItemError';
        // Custom debugging information
        this.code = errObject.code;
        this.msg = errObject.msg;
        this.message = `\n\n|========================= ${this.name}\n\nCode: ${this.code}\nMsg: ${this.msg}\n\n|========================= STACK TRACE\n${this.message}`;
    }
}

class UpdateItemError extends Error {
    constructor(errObject, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
    
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UpdateItemError);
        }
    
        this.name = 'UpdateItemError';
        // Custom debugging information
        this.code = errObject.code;
        this.msg = errObject.msg;
        this.message = `\n\n|========================= ${this.name}\n\nCode: ${this.code}\nMsg: ${this.msg}\n\n|========================= STACK TRACE\n${this.message}`;
    }
}

class UpdateObservationError extends Error {
    constructor(errObject, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
    
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UpdateObservationError);
        }
    
        this.name = 'UpdateObservationError';
        // Custom debugging information
        this.code = errObject.code;
        this.msg = errObject.msg;
        this.message = `\n\n|========================= ${this.name}\n\nCode: ${this.code}\nMsg: ${this.msg}\n\n|========================= STACK TRACE\n${this.message}`;
    }
}

/**
 * Composes a many to many table insertion function
 * @param {Boolean} isObservation 
 */
function insertManyToManyGenerator(isObservation, isUpdate) {
    let foreignKeyColumnName = 'item_id';
    if(isObservation) {
        foreignKeyColumnName = 'observation_id';
    }
    /**
     * Insert item_id|observation_id and list_id into a m2m table
     * @param {Number[]|Number} primaryKeyOfInsertedValue 
     * @param {Number} primaryKey 
     * @param {String} listTableName 
     * @param {Object} db 
     */
    return async (primaryKeyOfInsertedValue, primaryKey, listTableName, db) => {
        const manyToManyTableName = 'm2m_' + listTableName;
        if(type(primaryKeyOfInsertedValue) !== 'array') {
            primaryKeyOfInsertedValue = [primaryKeyOfInsertedValue];
        }
        try {
            // if updating, remove all many to many values first
            if(isUpdate) {
                await db.none(formatSQL(`
                    DELETE FROM $(manyToManyTableName:name)
                    WHERE $(foreignKeyColumnName:name) = $(primaryKey)
                `, {
                    manyToManyTableName,
                    foreignKeyColumnName,
                    primaryKey
                }));
            }
            for(let key of primaryKeyOfInsertedValue) {
                await db.none(formatSQL(`
                    INSERT INTO $(manyToManyTableName:name) 
                        (list_id, $(foreignKeyColumnName:name))
                        VALUES
                        ($(primaryKeyOfInsertedValue), $(primaryKey))
                `, {
                    manyToManyTableName,
                    primaryKeyOfInsertedValue: key,
                    primaryKey,
                    foreignKeyColumnName
                }));        
            }
        } catch(err) {
            throw new CreateItemError({code: 500, msg: `Error when inserting key ${key} and ${primaryKey} into ${manyToManyTableName}`});
        }
    };
}

/**
 * Composes an external column insertion function for inserting
 * values into list, attribute, or factor tables
 * @param {String} primaryKeyColumnName 
 * @param {Boolean} isMutable 
 * @param {String} referenceType
 * @param {Class} ErrorClass
 * @returns {Function}
 */
function externalColumnInsertGenerator(primaryKeyColumnName, isMutable, referenceType, ErrorClass) {
    /**
     * @param {String} tableName 
     * @param {String} columnName 
     * @param {String|Number|Date|Object|Boolean|Array} data 
     * @returns {<{columnName: String, columnValue: Number | Number[]}>} Array of primary keys if list reference type
     */
    return async (tableName, columnName, data, db) => {
        let primaryKey;
        const foreignKeyColumnName = tableName + '_id';
        // List Handling
        if(referenceType === 'item-list' || referenceType === 'obs-list') {
            // check to see if all values are valid
            try {
                
                if(data.length === 0) {
                    primaryKey = [];
                } else {
                    primaryKey = (await db.any(formatSQL(`
                        select list_id
                        from $(tableName:name)
                        WHERE $(columnName:name) IN ($(data:csv))
                    `, {
                        tableName,
                        columnName,
                        data,
                    }))).map(pk => pk.list_id);
                }

            } catch(err) {
                throw new ErrorClass({code: 500, msg: `Error when getting current list values from ${tableName}`});
            }
            // if there are new values
            if(primaryKey.length != data.length) {
                const newValues = data.filter(value => !primaryKey.includes(value));
                if(!isMutable) {
                    throw new ErrorClass({code: 400, msg: `Value(s) ${newValues} from list input ${data.length} are not valid for the column ${columnName} and table ${tableName}`})
                } else {
                    // insert new values
                    let newPrimaryKeys = [];
                    try {
                        for(let value of newValues) {
                            // Now insert
                            const newKey = (await db.one(formatSQL(`
                                INSERT INTO $(tableName:name) 
                                    ($(columnName:name))
                                    VALUES
                                    ($(value))
                                        RETURNING $(primaryKeyColumnName:name)
                            `, {
                                tableName,
                                columnName,
                                value,
                                primaryKeyColumnName
                            })))[primaryKeyColumnName];

                            newPrimaryKeys.push(newKey);
                        }
                        primaryKey = [...primaryKey, ...newPrimaryKeys];
                    } catch(err) {
                        throw new ErrorClass({code: 500, msg: `Error when inserting ${newValues} into ${tableName}`})
                    }
                }
            }
        } 
        // Location handling
        /*
        else if(referenceType == 'item-location') {
            // Now insert
            try {
                console.log(formatSQL(`
                INSERT INTO $(tableName:name) 
                    ($(columnName:name))
                    VALUES
                    (ST_GeomFromGeoJSON($(data)))
                        RETURNING $(primaryKeyColumnName:name)
            `, {
                tableName,
                columnName,
                data,
                primaryKeyColumnName
            }))
                primaryKey = (await db.one(formatSQL(`
                    INSERT INTO $(tableName:name) 
                        ($(columnName:name))
                        VALUES
                        (ST_GeomFromGeoJSON($(data)))
                            RETURNING $(primaryKeyColumnName:name)
                `, {
                    tableName,
                    columnName,
                    data,
                    primaryKeyColumnName
                })))[primaryKeyColumnName];
            } catch(err) {
                // This can probably be a 400 because this should only throw when the
                // geojson isn't valid
                throw new ErrorClass({code: 500, msg: 'Server error when inserting foreign key into the item or observation column'})
            }

            return {
                // Foreign key column name and value inside the item_... table
                columnName: foreignKeyColumnName,
                columnValue: primaryKey
            };
            
        } 
        */
        // Factor, Attribute handling
        else {
            let dataValue = formatSQL('$(data)', {
                data
            });
            try {
                // note db.many here, we are deciding not to throw
                // if more than one record is returned with the
                // value. This is to prevent upload from breaking
                // if duplicates are found in list, attribute,
                // or factor tables
                primaryKey = (await db.many(formatSQL(`
                    SELECT $(primaryKeyColumnName:name)
                    FROM $(tableName:name)
                    WHERE $(columnName:name) = $(dataValue:raw)
                `, {
                    tableName,
                    columnName,
                    dataValue,
                    primaryKeyColumnName
                })))[0][primaryKeyColumnName];

            } catch(err) {
                if(!isMutable) {
                    const validValues = (await db.any(formatSQL(`
                        SELECT $(columnName:name)
                        FROM $(tableName:name)
                    `, {
                        tableName,
                        columnName
                    }))).map(v => v[columnName]).join(', ');
                    throw new ErrorClass({code: 400, msg: `The value ${dataValue} is not one of the valid values (${validValues}) for ${tableName}`});
                }

                // Now insert
                try {
                    primaryKey = (await db.one(formatSQL(`
                        INSERT INTO $(tableName:name) 
                            ($(columnName:name))
                            VALUES
                            ($(data))
                                RETURNING $(primaryKeyColumnName:name)
                    `, {
                        tableName,
                        columnName,
                        data,
                        primaryKeyColumnName
                    })))[primaryKeyColumnName];
                } catch(err) {
                    throw new ErrorClass({code: 500, msg: 'Server error when inserting foreign key into the item or observation column'})
                }
            }
        }
        return {
            // Foreign key column name and value inside the item or observation table
            columnName: foreignKeyColumnName,
            columnValue: primaryKey
        };
    };
}

/**
 * Composes an external column insertion function for inserting
 * values into list, attribute, factor, or location tables
 * @param {String} primaryKeyColumnName 
 * @param {Boolean} isMutable 
 * @param {String} referenceType
 * @returns {Function}
 */
function externalColumnUpdateGenerator(primaryKeyColumnName, isMutable, referenceType) {
    /**
     * @param {String} tableName 
     * @param {String} columnName 
     * @param {String|Number|Date|Object|Boolean|Array} data 
     * @returns {<{columnName: String, columnValue: Number | Number[]}>} Array of primary keys if list reference type
     */
    return async (tableName, columnName, data) => {
        let primaryKey;
        const foreignKeyColumnName = tableName + '_id';
        // List handling
        if(referenceType === 'item-list' || referenceType == 'obs-list') {
            // check to see if all values are valid
            try {
                primaryKey = await db.many(formatSQL(`
                    select list_id
                    from $(tableName:name)
                    WHERE $(columnName:name) = ANY ($(data:array))
                `, {
                    tableName,
                    columnName,
                    data,
                }));
                
            } catch(err) {
                throw new UpdateItemError({code: 500, msg: `Error when getting current list values from ${tableName}`});
            }
            // if there are new values
            if(primaryKey.length != data.length) {
                const newValues = data.length.filter(value => !primaryKey.includes(value));
                if(!isMutable) {
                    throw new CreateItemError({code: 400, msg: `Value(s) ${newValues} from list input ${data.length} are not valid for the column ${columnName} and table ${tableName}`})
                } else {
                    // insert new values
                    let newPrimaryKeys = [];
                    try {
                        for(let value of newValues) {
                            // Now insert
                            const newKey = (await db.one(formatSQL(`
                                INSERT INTO $(tableName:name) 
                                    ($(columnName:name))
                                    VALUES
                                    ($(value))
                                        RETURNING $(primaryKeyColumnName:name)
                            `, {
                                tableName,
                                columnName,
                                value,
                                primaryKeyColumnName
                            })))[primaryKeyColumnName];
                            newPrimaryKeys.push(newKey);
                        }
                        primaryKey = [...primaryKey, ...newPrimaryKeys];
                    } catch(err) {
                        throw new CreateItemError({code: 500, msg: `Error when inserting ${newValues} into ${tableName}`})
                    }
                }
            }
        }
        // Location handling
        else if(referenceType === 'item-location') {

        }
        // Factor, Attribute handling
        else {

        }
    }
}


const sqlToJavascriptLookup = {
    numeric: 'number',
    integer: 'number',
    timestamptz: 'string',
    boolean: 'boolean',
    json: 'object',
    point: 'object',
    linestring: 'object',
    polygon: 'object',
    text: 'string'
};
function validateDataColumnsGenerator(isObservation, isUpdate, ErrorClass) {
    /**
     * Validate data types and preset values of data fields. Throws an error if not
     * @param {createItemObject.data} dataObject
     * @param {string} tableName
     * @returns {undefined} 
     */
    return function validateDataColumns(dataObject, tableName) {
        const {returnableIDs, data} = dataObject
        const columnIDs = returnableIDs.map(id => returnableIDLookup[id].columnID);
        // Get all of the columns needed to insert the item
        let itemColumns = itemColumnObject[tableName];
        itemColumns = itemColumns['c__column_id'].map((id, i) => ({
            columnID: id,
            isNullable: itemColumns['c__is_nullable'][i],
            isItem: itemColumns.isItem[i],
            isObservation: itemColumns.isObservation[i]
        }));

        let relevantColumnObjects;
        if(isObservation) {
            relevantColumnObjects = itemColumns.filter(col => col.isObservation);
        } else {
            relevantColumnObjects = itemColumns.filter(col => col.isItem);
        }
        const relevantColumnIDs = relevantColumnObjects.map(col => col.columnID);        

        // make sure all non nullable fields are included when creating a new item
        if(!isUpdate) {
            const nonNullableColumnIDs = relevantColumnObjects.filter(col => !col.isNullable).map(col => col.columnID);
            if(!nonNullableColumnIDs.every(id => columnIDs.includes(id))) throw new ErrorClass({code: 400, msg: `Must include columnIDs ${nonNullableColumnIDs} and only included ${columnIDs} for ${tableName}`});
        }
        
        // check type of each field
        returnableIDs.forEach((returnableID, i) => {
            // convert id to returnableID
            const columnID = returnableIDLookup[returnableID].columnID
            // is it one of the data columns?
            if(relevantColumnIDs.includes(columnID)) {
                // get correct type
                let correctType = sqlToJavascriptLookup[returnableIDLookup[returnableID].sqlType.toLowerCase()]
                // make sure it's an array if list reference type or SOP
                if(['item-list', 'obs-list'].includes(returnableIDLookup[returnableID].referenceType) || ('special' === returnableIDLookup[returnableID].referenceType && 'Standard Operating Procedure' === returnableIDLookup[returnableID].frontendName)) {
                    if(type(data[i]) !== 'array') throw new ErrorClass({code: 400, msg: `returnableID ${returnableID} must be of type: array`})
                    // check type for every value
                    data[i].forEach((listElement, i) => {
                        if(type(listElement) !== correctType) throw new ErrorClass({code: 400, msg: `Element ${listElement} (index: ${i}) of returnableID ${returnableID} of columnID ${columnID} must of of type: ${correctType}`})
                    });
                }
                // check type for others
                else {
                    if(type(data[i]) !== correctType) {
                        throw new ErrorClass({code: 400, msg: `returnableID ${returnableID} of columnID ${columnID} must of of type: ${correctType}. Currently: ${type(data[i])}`})
                    }     
                }
                // format GeoJSON
                if(['geoPoint', 'geoLine', 'geoRegion'].includes(returnableIDLookup[returnableID].selectorType)) {
                    data[i] = JSON.stringify(data[i]);
                }
                // format date
                if(returnableIDLookup[returnableID].selectorType === 'date') {
                    if(isValidDate(data[i])) {
                        data[i] = dateToUTC(data[i]);
                    } else {
                        throw new ErrorClass({code: 400, msg: `returnableID ${returnableID} of columnID ${columnID} must be of type date in format: MM-DD-YYYY`})
                    }
                }
                
            } else {
                throw new ErrorClass({code: 400, msg: `returnableID ${returnableID} of columnID ${columnID} is not valid for ${tableName}`})
            }
        })
    }
}

function insertHistoryGenerator(isObservation) {
    const historyLookup = isObservation ? observationHistory : itemHistory;
    const foreignKeyColumnName = isObservation ? 'observation_id' : 'item_id';

    return async function insertHistory(baseTableName, historyType, primaryKey, db) {
        const historyTableName = 'history_' + baseTableName;
        const typeID = historyLookup[historyType];

        await db.none(formatSQL(`
            insert into $(historyTableName:name)
            (type_id, $(foreignKeyColumnName:raw), time_submitted)
            values
            ($(typeID), $(primaryKey), NOW())
        `, {
            historyTableName,
            typeID,
            primaryKey,
            foreignKeyColumnName
        }))
    }
}

/**
 * Validate the required items are correct. Throws an error if not
 * @param {Array} requiredItemTableNames 
 * @param {string} tableName
 * @returns {undefined} 
 * 
 * uses requiredItemLookup
 */
function validateRequiredItems(requiredItemTableNames, tableName) {
    // make sure all required items exist and all non nullable required items are included
    const nonNullableNeededAmount = requiredItemLookup[tableName].nonNullable.length;
    let nonNullableCurrentAmount = 0;
    for(let table of requiredItemTableNames) {
        // if non nullable
        if(requiredItemLookup[tableName].nonNullable.includes(table)) {
            nonNullableCurrentAmount ++;
        // if not in the nullable set either then throw
        } else if(!requiredItemLookup[tableName].nullable.includes(table)) {
            throw new CreateItemError({code: 400, msg: `${table} is not a required item of ${tableName}`});
        }
    }
    // Make sure all non nullables have been included
    if(nonNullableCurrentAmount !== nonNullableNeededAmount) {
        throw new CreateItemError({code: 400, msg: `Not all non-nullable required items have been included for ${tableName}. Needed ${[...requiredItemLookup[tableName].nonNullable, 'item_global']} and got ${requiredItemTableNames}`});
    }
}

/**
 * Validate the required items are correct. Throws an error if not
 * @param {Array} requiredItemTableNames 
 * @param {string} tableName
 * @returns {undefined} 
 * 
 * uses requiredItemLookup
 */
function validateRequiredItemsOnUpdate(requiredItemTableNames, tableName) {
    // make sure all required items are non nullable
    for(let requiredItemTableName of requiredItemTableNames) {
        if(!requiredItemLookup[tableName].nonId.includes(requiredItemTableName)) {
            throw new UpdateItemError({code: 400, msg: `${requiredItemTableName} is an identifying required item for ${tableName} and thus cannot be updated`});
        }
    }
}

function insertSOPGenerator(isUpdate, ErrorClass) {
    return async (sopValue, observationCount, globalPrimaryKey, db) => {
        // if updating remove old values
        if(isUpdate) {
            try {
                // remove all current
                await db.none(formatSQL(`
                    DELETE FROM m2m_item_sop
                    WHERE observation_count_id = $(observationCount)
                `, {
                    observationCount
                }));
            } catch {
                ErrorClass({code: 500, msg: 'Error when removing old SOP on update'});
            }
        }
        // Insert new values
        // First get organization ID from global
        let organizationID;
        try {
            organizationID = (await db.one(formatSQL(`
                select item_organization_id as id
                from item_global
                where item_id = $(globalPrimaryKey)
            `, {
                globalPrimaryKey
            }))).id;
        } catch(err) {
            throw new ErrorClass({code: 500, msg: `Error when getting organization ID from global with primary key ${globalPrimaryKey}`});
        }
        // SOP Value is validated to be an array
        for(let sopName of sopValue) {
            try {
                const sopPrimaryKey = (await db.one(formatSQL(`
                    select item_id from item_sop
                    where data_name = $(sopName)
                    and item_organization_id = $(organizationID)
                `, {
                    sopName,
                    organizationID
                }))).item_id;
        
                await db.none(formatSQL(`
                    insert into m2m_item_sop
                    (observation_count_id, item_sop_id)
                    values
                    ($(observationCount), $(sopPrimaryKey))
                `, {
                    observationCount,
                    sopPrimaryKey
                }));
            } catch (err) {
                throw new ErrorClass({code: 400, msg: `SOP "${sopName}" is not a valid SOP in your organization`});
            }
        }
    }
}

 
module.exports = {
    externalColumnInsertGenerator,
    insertItemManyToMany: insertManyToManyGenerator(false, false),
    insertObservationManyToMany: insertManyToManyGenerator(true, false),
    updateItemManyToMany: insertManyToManyGenerator(false, true),
    updateObservationManyToMany: insertManyToManyGenerator(true, true),
    validateItemDataColumns: validateDataColumnsGenerator(false, false, CreateItemError),
    validateObservationDataColumns: validateDataColumnsGenerator(true, false, CreateObservationError),
    validateUpdateItemDataColumns: validateDataColumnsGenerator(false, true, CreateItemError),
    validateUpdateObservationDataColumns: validateDataColumnsGenerator(true, true, CreateObservationError),
    insertItemHistory: insertHistoryGenerator(false),
    insertObservationHistory: insertHistoryGenerator(true),
    insertSOP: insertSOPGenerator(false, CreateObservationError),
    updateSOP: insertSOPGenerator(true, UpdateObservationError),
    validateRequiredItems,
    validateRequiredItemsOnUpdate,
    CreateItemError,
    CreateObservationError,
    DeleteObservationError,
    DeleteItemError,
    UpdateItemError,
    UpdateObservationError
};