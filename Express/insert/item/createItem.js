const {postgresClient} = require('../../db/pg.js');
const formatSQL = postgresClient.format;
const type = require('@melgrove/type');
const {
    returnableIDLookup,
    itemM2M,
    allItems,
    requiredItemLookup,
    itemColumnObject,
    itemTableNames
} = require('../../setup.js');

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
    }
  }

/****************************
    Request Object Definition
*/

/**
 * A new item to be inserted into the database
 * @typedef {Object} createItemObject
 * @property {Number} itemTypeID
 * @property {Array.<{itemTypeID: Number, primaryKey: Number}>} requiredItems
 * @property {Number[]} newRequiredItemIndices
 * @property {?Number} globalPrimaryKey
 * @property {?Number} newGlobalIndex
 * @property {Array.<{returnableIDs: Number[], data: Object}>} data
 */

/**
 * An array of the items in the current schema
 * @typedef {allItemsObject[]} allItems
 */

/**
 * @typedef {Object} allItemsObject
 * @property {String} i__table_name 'item_organization'
 * @property {String} i__frontend_name 'Organization'
 * @property {String} t__type_name 'non-observable'
 * @property {Number} i__creation_privilege 3
 * @property {Number} i__item_id 2
 */

/*****************
    Static Objects
*/

const sqlToJavascriptLookup = {
    numeric: 'number',
    integer: 'number',
    timestamptz: 'date',
    boolean: 'boolean',
    json: 'object',
    point: 'object',
    linestring: 'object',
    polygon: 'object',
    text: 'string'
}

/*
DEPRECATED, THIS VALIDATION IS DONE ON INSERT
Includes for all attribute, list, and factor
{
    columnID: [JS value, ...]
}
*/
const dataColumnPresetLookup = {

}

/********************
    Exported Function
*/

module.exports = createItem
/**
 * Inserts items into the database
 * @param {Object} options
 * @param {Array.<createItemObject>} options.createItemObjectArray
 * @param {Object} options.transaction database transaction
 * @returns {Array.<Number[]>} insertedItemPrimaryKeyLookup
 * @throws {{err: Number, msg: String}} HTTP error code and message
 * 
 * Steps:
 *   1. validateRequiredItems()
 *   2. validateDataColumns()
 *   3. createIndividualItem()
 */
async function createItem(options) {

   const {
       createItemObjectArray,
       transaction
   } = options

   // Validate reqiured items and data fields for every item
   try {
       for(let createItemObject of createItemObjectArray) {
           const tableName = itemTableNames[createItemObject.itemTypeID]
           if(tableName === undefined) {
               throw new CreateItemError({code: 400, msg: `itemTypeID: ${createItemObject.itemTypeID} is not valid`})
           }
           // TODO: make requiredItemLookup
           // 1. Validate required items
           validateRequiredItems([
               ...createItemObject.requiredItems.map(el => itemTableNames[el.itemTypeID]), 
               ...createItemObject.newRequiredItemIndices.map(el => itemTableNames[createItemObjectArray[el].itemTypeID])
           ], tableName)
    
           // TODO: make dataColumnPresetLookup, add handling for mutible reference types
           // 2. Validate data columns
           validateDataColumns(createItemObject.data, tableName)
       }

   console.log('Validated');

   // 3. Insert every item
   let currentInsertedItemPrimaryKeyLookup = createItemObjectArray.map(el => null)
   for(let i = 0; i < createItemObjectArray.length; i++) {
       currentInsertedItemPrimaryKeyLookup = await createIndividualItem(i, createItemObjectArray, currentInsertedItemPrimaryKeyLookup, transaction)
   }

   // sanity check
   if(currentInsertedItemPrimaryKeyLookup.some(el => el === null)) {
       throw new CreateItemError({code: 500, msg: `Computer did not insert all the items! Here is the array: ${currentInsertedItemPrimaryKeyLookup}`})
   }

   return currentInsertedItemPrimaryKeyLookup;
    } catch(err) {
        if(err instanceof CreateItemError) {
            throw new CreateItemError({code: err.code, msg: err.msg})
        } else {
            throw new CreateItemError({code: 500, msg: err})
        }
    }
}

/*******************
    Helper Functions
*/

/**
 * Inserts an item into the database
 * @param {Number} currentIndex
 * @param {createItemObject[]} createItemObjectArray
 * @param {Number[]} insertedItemPrimaryKeyLookup
 * @param {Object} db database transaction
 * @returns {Array.<?Number>} insertedItemPrimaryKeyLookup
 * 
 * Fully inserts an item into the database. If a required item is self referencing,
 * meaning that it needs the id of an item that is also being uploaded, it recursively
 * calls itself to insert that item first and get its primary key 
 * Steps:
 *   1. Handle global item reference
 *   2. Handle createItemObject self reference
 *   3. Insert external columns and get primary keys
 *   4. Make SQL statement
 *   5. Insert item into database with internal and external columns
 *   6. Insert list values and many to many values
 *   7. Insert history
 */
async function createIndividualItem(currentIndex, createItemObjectArray, insertedItemPrimaryKeyLookup, db) {
    // first check if this item has already been recursively inserted, and skip if so
    if(insertedItemPrimaryKeyLookup[currentIndex] !== null) {
        return insertedItemPrimaryKeyLookup;
    }
    // get current createItemObject
    const createItemObject = createItemObjectArray[currentIndex]
    // unpack
    const tableName = itemTableNames[createItemObject.itemTypeID]
    let requiredItems = createItemObject.requiredItems
    let globalReference = null

    // 1. Handle global item reference, call recursively if the global item must be created
    //    individually first
    if(createItemObject.globalPrimaryKey === null) {
        if(createItemObject.newGlobalIndex !== null) {
            // if global item has not been inserted yet then make it
            if(insertedItemPrimaryKeyLookup[createItemObject.newGlobalIndex] === null) {
                insertedItemPrimaryKeyLookup = createIndividualItem(createItemObject.newGlobalIndex, createItemObjectArray, insertedItemPrimaryKeyLookup, db)
            } else {
            // otherwise store primary key
                globalReference = insertedItemPrimaryKeyLookup[createItemObject.newGlobalIndex]
            }
        }
    } else {
        globalReference = createItemObject.globalPrimaryKey
    }

    // 2. Handle self-referenced items, call recursively if a self referenced item must be
    //    created individually first
    for(let index of createItemObject.newRequiredItemIndices) {
        // insert if not done yet
        if(insertedItemPrimaryKeyLookup[index] === null) {
            // insert and update lookup
            insertedItemPrimaryKeyLookup = await createIndividualItem(index, createItemObjectArray, insertedItemPrimaryKeyLookup, db);
            // sanity check
            if(insertedItemPrimaryKeyLookup[index] === null) throw new CreateItemError({code: 500, msg: `Error in required item recursion, createItemObject at index ${index} never got inserted`});
        }
        // add to requiredItems
        requiredItems.push({
            itemTypeID: createItemObjectArray[index].itemTypeID,
            primaryKey: insertedItemPrimaryKeyLookup[index]
        });
    }

    // Get all of the columns needed to insert the item
    let itemColumns = itemColumnObject[tableName];
    itemColumns = itemColumns['c__column_id'].map((id, i) => ({
        columnID: id,
        columnName: itemColumns['c__column_name'][i],
        tableName: itemColumns['c__table_name'][i],
        isNullable: itemColumns['c__is_nullable'][i],
        referenceType: itemColumns['r__type_name'][i],
        isItem: itemColumns.isItem[i],
        isObservation: itemColumns.isObservation[i]
    }));

    const relevantColumnObjects = itemColumns.filter(col => col.isItem)
    const relevantColumnIDs = relevantColumnObjects.map(col => col.columnID)
    const nonNullableColumnIDs = relevantColumnObjects.filter(col => !col.isNullable).map(col => col.columnID);

    // Generate external column insertion functions
    const insertExternalColumn = {
        'attribute-mutable': externalColumnInsertGenerator('attribute_id', true, 'attribute-mutable', db),
        'attribute': externalColumnInsertGenerator('attribute_id', false, 'attribute', db),
        'item-factor-mutable': externalColumnInsertGenerator('factor_id', true, 'item-factor-mutable', db),
        'item-factor': externalColumnInsertGenerator('factor_id', false, 'item-factor', db),
        'item-location-mutable': externalColumnInsertGenerator('location_id', true, 'item-location-mutable', db),
        'item-location': externalColumnInsertGenerator('location_id', false, 'item-location', db),
        'item-list': externalColumnInsertGenerator('list_id', false, 'item-list', db),
        'item-list-mutable': externalColumnInsertGenerator('list_id', true, 'item-list-mutable', db)
    };

    // 3. Go through user supplied data columns and add column names and column values
    //    to the columnNamesAndValues array. For external data columns, either insert
    //    the value into the external table first and add the newly created primary key,
    //    or reference an existing primary key if the value already exists in the
    //    external table
    let columnNamesAndValues = [];
    let listColumnsAndValues = [];
    let i = 0
    for(let id of createItemObject.data.returnableIDs) {
        // Convert returnableID to columnID
        const columnID = returnableIDLookup[id].columnID;
        // if the returnable is valid
        if(itemColumns.map(col => col.columnID).includes(columnID)) {
            // if nullable then remove from nullable list
            if(nonNullableColumnIDs.includes(columnID)) {
                const removalIndex = nonNullableColumnIDs.indexOf(columnID);
                nonNullableColumnIDs.splice(removalIndex, 1);
            }
            // get the column metadata
            const itemColumn = itemColumns.filter(col => col.columnID == columnID)[0];
            // get the user passed insertion value
            const columnValue = createItemObject.data.data[i];

            // if the column is external call the proper insertion function based on reference type and pass metadata and value
            if(itemColumn.referenceType in insertExternalColumn) {
                const primaryKeyAndColumnName = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue);
                columnNamesAndValues.push(primaryKeyAndColumnName);
            // if list add to list array and handle after item insert
            } else if(['item-list', 'item-list-mutable'].includes(itemColumn.referenceType)) {
                listColumnsAndValues.push({
                    itemColumn,
                    columnValue
                });
            // then a local column
            } else {
                columnNamesAndValues.push({
                    columnName: itemColumn.columnName,
                    columnValue
                });
            }
        // then not valid
        } else {
            throw new CreateItemError({code: 400, msg: `returnableID ${id} is not valid for ${tableName}`});
        }
        i++;
    }
    // If not all the non-nullable columns have been included then throw 
    //////// will maybe have to handle inputSelectorType = null here?
    if(nonNullableColumnIDs.length !== 0) throw new CreateItemError({code: 400, msg: `Missing (${nonNullableColumnIDs.join(', ')}) non nullable column IDs for ${tableName}`});

    // 4. Make the finished SQL statement
    const fullSQLStatement = makeItemSQLStatement(tableName, columnNamesAndValues, globalReference, requiredItems);

    // 5. Attempt to insert into the database and get the primary key
    const itemPrimaryKey = (await db.one(fullSQLStatement)).item_id;

    // 6. Insert list values and list many to many values
    for(let columnsAndValues of listColumnsAndValues) {
        const {itemColumn, columnValue} = columnsAndValues;

        // 1. Insert into the list_... table
        const {primaryKeyOfInsertedValue} = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue);

        // insert into the many to many table
        await insertManyToMany(primaryKeyOfInsertedValue, itemPrimaryKey, listTableName, db);
    }

    // 7. Insert insertion record into history tables
    // ??

    // Update the primary key lookup and return it
    insertedItemPrimaryKeyLookup[currentIndex] = itemPrimaryKey;
    return insertedItemPrimaryKeyLookup;
}

/**
 * Makes the complete insertion SQL statement
 * @param {String} tableName 
 * @param {Array.<{columnName: String, columnValue: String|Number|Date|Object|Boolean}>} columnNamesAndValues 
 * @param {Number|null} globalReference 
 */
function makeItemSQLStatement(tableName, columnNamesAndValues, globalReference, requiredItems) {
    const itemMetadata = allItems.filter(item => item['i__table_name'] == tableName)[0];

    // add required item references to columnNamesAndValues
    requiredItems.forEach(reference => {
        columnNamesAndValues.push({
            columnName: itemTableNames[reference.itemTypeID] + '_id',
            columnValue: reference.primaryKey
        })
    })

    // if observable then have to add the global reference and is_existing field
    if(['observable', 'potential-observable'].includes(itemMetadata['t__type_name'])) {
        columnNamesAndValues.push({
            columnName: 'is_existing',
            columnValue: true
        });
        columnNamesAndValues.push({
            columnName: 'global_id',
            columnValue: globalReference
        });
    }

    // make the column names SQL string
    let columnNamesSQL = [];
    columnNamesAndValues.map(col => col.columnName).forEach(columnName => {
        columnNamesSQL.push(formatSQL('$(columnName:name)', {
            columnName
        }));
    });
    columnNamesSQL = '( ' + columnNamesSQL.join(', ') + ' )';

    // make the column values SQL string
    let columnValuesSQL = [];
    columnNamesAndValues.map(col => col.columnValue).forEach(columnValue => {
        columnValuesSQL.push(formatSQL('$(columnValue)', {
            columnValue
        }));
    });
    columnValuesSQL = '( ' + columnValuesSQL.join(', ') + ' )';
    
    // make the full statement and return it
    const fullInsertSQL = formatSQL(`
        INSERT INTO $(tableName:name) 
            $(columnNamesSQL:raw) 
            VALUES $(columnValuesSQL:raw)
                RETURNING "item_id"
    `, {
        tableName,
        columnNamesSQL,
        columnValuesSQL
    });

    return fullInsertSQL;
}

/**
 * Composes an external column insertion function
 * @param {String} primaryKeyColumnName 
 * @param {Boolean} isMutable 
 * @param {String} referenceType 
 * @param {Object} db 
 */
function externalColumnInsertGenerator(primaryKeyColumnName, isMutable, referenceType, db) {
    /**
     * @param {String} tableName 
     * @param {String} columnName 
     * @param {String|Number|Date|Object|Boolean|Array} data 
     * @returns {<{columnName: String, primaryKey: Number | Array.<Number>}>}
     * // Array of values if list reference type
     */
    return async (tableName, columnName, data) => {
        let primaryKey;
        const foreignKeyColumnName = tableName + '_id';
        // List Handling
        if(referenceType === 'item-list') {
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
                throw new CreateItemError({code: 500, msg: `Error when getting current list values from ${tableName}`});
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
        // Factor, Attribute, Location handling
        } 
        else if(referenceType == 'item-location') {
            // Now insert
            try {
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
                throw new CreateItemError({code: 500, msg: 'Server error when inserting foreign key into the item or observation column'})
            }

            return {
                // Foreign key column name and value inside the item_... table
                columnName: foreignKeyColumnName,
                columnValue: primaryKey
            };
            
        } else {
            let dataValue = formatSQL('$(data)', {
                data
            });
            try {
                // note db.many here, we are deciding not to throw
                // if more than one record is returned with the
                // value. This is to prevent upload from breaking
                // if duplicates are found in list, attribute, location,
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
                        SELECT $(columnName:name)::json
                        FROM $(tableName:name)
                    `, {
                        tableName,
                        columnName
                    }))).map(v => v[columnName]).join(', ');
                    throw new CreateItemError({code: 400, msg: `The value ${data} is not one of the valid values (${validValues}) for ${tableName}`});
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
                    throw new CreateItemError({code: 500, msg: 'Server error when inserting foreign key into the item or observation column'})
                }
            }
                
        }
        return {
            // Foreign key column name and value inside the item_... table
            columnName: foreignKeyColumnName,
            columnValue: primaryKey
        };
    };
}

/**
 * Insert item_id and list_id into a m2m table
 * @param {Number} primaryKeyOfInsertedValue 
 * @param {Number} itemPrimaryKey 
 * @param {String} listTableName 
 * @param {Object} db 
 */
async function insertManyToMany(primaryKeyOfInsertedValue, itemPrimaryKey, listTableName, db) {
    const manyToManyTableName = 'm2m_' + listTableName;
    if(type(primaryKeyOfInsertedValue) !== 'array') {
        primaryKeyOfInsertedValue = [primaryKeyOfInsertedValue];
    }
    for(let key of primaryKeyOfInsertedValue) {
        try {
            await db.none(formatSQL(`INSERT INTO $(manyToManyTableName:name) 
                (list_id, item_id)
                VALUES
                ($(primaryKeyOfInsertedValue), $(itemPrimaryKey))
            `, {
                manyToManyTableName,
                primaryKeyOfInsertedValue: key,
                itemPrimaryKey
            }));        
        } catch(err) {
            throw new CreateItemError({code: 500, msg: `Error when inserting key ${key} and ${itemPrimaryKey} into ${manyToManyTableName}`});
        }
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



////////////////////////// Pretty sure I can remove the preset stuff because it's handled during insertion!
/**
 * Validate data types and preset values of data fields. Throws an error if not
 * @param {createItemObject.data} dataObject
 * @param {string} tableName
 * @returns {undefined} 
 */
function validateDataColumns(dataObject, tableName) {
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
    const relevantColumnObjects = itemColumns.filter(col => col.isItem)

    const relevantColumnIDs = relevantColumnObjects.map(col => col.columnID)

    // make sure all non nullable fields are included
    const nonNullableColumnIDs = relevantColumnObjects.filter(col => !col.isNullable).map(col => col.columnID);
    if(!nonNullableColumnIDs.every(id => columnIDs.includes(id))) throw new CreateItemError({code: 400, msg: `Must include columnIDs ${nonNullableColumnIDs} and only included ${columnIDs} for ${tableName}`})
    
    // handle generated columns
    // handle Auditor Name

    
    // check each field
    returnableIDs.forEach((returnableID, i) => {
        // convert id to returnableID

        id = returnableIDLookup[returnableID].columnID
        // is it one of the data columns?
        if(relevantColumnIDs.includes(id)) {
            // list
            if(['item-list', 'obs-list'].includes(returnableIDLookup[id].rt__type_name)) {
                if(type(data[i]) !== 'array') throw new CreateItemError({code: 400, msg: `returnableID ${id} must be of type: array`})
                // preset values
                //data[i].forEach(val => {
                //    if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(val)) throw new CreateItemError({code: 400, msg: `${val} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`})
                //})
            }
            // factor
            else if(['item-factor', 'obs-factor'].includes(returnableIDLookup[id].referenceType)) {
                // preset values
                // if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(data[i])) throw new CreateItemError({code: 400, msg: `${data[i]} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`})
            }
            // attribute
            else if(returnableIDLookup[id].referenceType === 'attribute') {
                // if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(data[i])) throw new CreateItemError({code: 400, msg: `${data[i]} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`})     
            }
            // other
            else {
                let correctType = sqlToJavascriptLookup[returnableIDLookup[returnableID].sqlType.toLowerCase()]
                if(type(data[i]) !== correctType) throw new CreateItemError({code: 400, msg: `returnableID ${returnableID} of columnID ${id} must of of type: ${correctType}`})
            }
        } else {
            throw new CreateItemError({code: 400, msg: `returnableID ${returnableID} of columnID ${id} is not valid for ${tableName}`})
        }
    })
}
