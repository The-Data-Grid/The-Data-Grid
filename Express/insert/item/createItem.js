const {postgresClient} = require('../db/pg.js');
const formatSQL = postgresClient.format;
const type = require('@melgrove/type');
const {
    returnableIDLookup,
    itemM2M,
    allItems,
    itemColumnObject
} = require('./setup.js');

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

// from setupObject, identifies type of item (ex. item_sink vs item_mirror) based on index
const itemTableNames = allItems.map(item => item['i__table_name'])

/**
 * Validation lookup to verify proper item insertion
 * @typedef {Object} requiredItemLookup
 * @property {Object} tableName Reprsents a single item and all of its required items. Property should exist for every item in the schema
 * @property {Number[]} tableName.nullable
 * @property {Number[]} tableName.nonNullable
 */
const requiredItemLookup = {
    tableName: {
        nullable: [],
        nonNullable: []
    }
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
   for(let createItemObject of createItemObjectArray) {
       const tableName = itemTableNames[createItemObject.itemTypeID]
       if(tableName === undefined) {
           throw Error({code: 400, msg: `itemTypeID: ${createItemObject.itemTypeID} is not valid`})
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

   // 3. Insert every item
   let currentInsertedItemPrimaryKeyLookup = createItemObjectArray.map(el => null)
   for(let i = 0; i < createItemObjectArray.length; i++) {
       currentInsertedItemPrimaryKeyLookup = await createIndividualItem(i, createItemObjectArray, currentInsertedItemPrimaryKeyLookup, transaction)
   }

   // sanity check
   if(currentInsertedItemPrimaryKeyLookup.some(el => el === null)) {
       throw Error({code: 500, msg: `Computer did not insert all the items! Here is the array: ${currentInsertedItemPrimaryKeyLookup}`})
   }

   return currentInsertedItemPrimaryKeyLookup;
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
 *   2. Handle self reference
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
            insertedItemPrimaryKeyLookup = createIndividualItem(index, createItemObjectArray, insertedItemPrimaryKeyLookup, db);
            // sanity check
            if(insertedItemPrimaryKeyLookup[index] === null) throw Error({code: 500, msg: `Error in required item recursion, createItemObject at index ${index} never got inserted`});
        }
        // add to requiredItems
        requiredItems.push({
            itemTypeID: createItemObjectArray[index],
            primaryKey: insertedItemPrimaryKeyLookup[index]
        });
    }

    // Get all of the columns needed to insert the item
    let itemColumns = itemColumnObject.filter(item => item['i__table_name'] == tableName)[0];
    itemColumns = itemColumns['c__column_id'].map((id, i) => ({
        columnID: id,
        columnName: itemColumns['c__column_name'][i],
        tableName: itemColumns['c__table_name'][i],
        isNullable: itemColumns['c__is_nullable'][i],
        referenceType: itemColumns['r__type_name'][i]
    }));
    let nonNullableColumnIDs = itemColumns.filter(col => !col.isNullable).map(col => col.columnID);

    // Generate external column insertion functions
    const insertExternalColumn = {
        'attribute-mutable': externalColumnInsertGenerator('attribute_id', true, db),
        'attribute': externalColumnInsertGenerator('attribute_id', false, db),
        'item-factor-mutable': externalColumnInsertGenerator('factor_id', true, db),
        'item-factor': externalColumnInsertGenerator('factor_id', false, db),
        'item-location-mutable': externalColumnInsertGenerator('location_id', true, db),
        'item-location': externalColumnInsertGenerator('location_id', false, db)
    };

    // 3. Go through user supplied data columns and add column names and column values
    //    to the columnNamesAndValues array. For external data columns, either insert
    //    the value into the external table first and add the newly created primary key,
    //    or reference an existing primary key if the value already exists in the
    //    external table
    let columnNamesAndValues = [];
    let listColumnsAndValues = [];
    createItemObject.data.returnableIDs.forEach((id, i) => {
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
            throw Error({code: 400, msg: `returnableID ${id} is not valid for ${tableName}`});
        }
    })
    // If not all the non-nullable columns have been included then throw 
    //////// will maybe have to handle inputSelectorType = null here?
    if(nonNullableColumnIDs.length !== 0) throw Error({code: 400, msg: `Missing (${nonNullableColumnIDs.join(', ')}) non nullable column IDs for ${tableName}`});

    // 4. Make the finished SQL statement
    const fullSQLStatement = makeItemSQLStatement(tableName, columnNamesAndValues, globalReference);

    // 5. Attempt to insert into the database and get the primary key
    const itemPrimaryKey = await db.one(fullSQLStatement);

    // 6. Insert list values and list many to many values
    listColumnsAndValues.forEach(col => {
        // 1. I think I can use the old function
    })

    // 7. Insert insertion record into history tables

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
function makeItemSQLStatement(tableName, columnNamesAndValues, globalReference) {
    const itemMetadata = allItems.filter(item => item['i__table_name'] == tableName)[0];

    // if observable then have to add the global reference and is_existing field
    if(['observable', 'potential-observable'].includes(itemMetadata['t__type_name'])) {
        columnNamesAndValues.push({
            columnName: 'is_existing',
            columnValue: true
        },
        {
            columnName: 'global_id',
            columnValue: globalReference
        });
    }

    // make the column names SQL string
    let columnNamesSQL = [];
    columnNamesAndValues.map(col => col.columnName).forEach(columnName => {
        columnNamesSQL.push(formatSQL('$(columnName):name', {
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
 * @param {*} primaryKeyColumnName 
 * @param {*} isMutable 
 */
function externalColumnInsertGenerator(primaryKeyColumnName, isMutable, db) {
    /**
     * @param {String} tableName 
     * @param {String} columnName 
     * @param {String|Number|Date|Object|Boolean} data 
     */
    return async (tableName, columnName, data) => {
        let primaryKey;
        const foreignKeyColumnName = tableName + '_id';
        // 1. see if the value already exists
        try {
            primaryKey = await db.many(`
                SELECT $(primaryKeyColumnName:name)
                FROM $(tableName:name)
                WHERE $(columnName:name) = $(data)
            `, {
                tableName,
                columnName,
                data,
                primaryKeyColumnName
            })[0];
        // then record doesn't exist yet
        } catch(err) {
            // if it's not mutable then throw
            if(!isMutable) {
                const validValues = await db.any(`
                    SELECT $(primaryKeyColumnName:name)
                    FROM $(tableName:name)
                `, {
                    tableName,
                    columnName,
                    primaryKeyColumnName
                }).map(v => v[primaryKeyColumnName]).join(', ');
                throw Error({code: 400, msg: `The value ${data} is not one of the valid values (${validValues}) for ${tableName}`});
            }
            primaryKey = await db.one(`
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
            });
        }
        
        return {
            columnName: foreignKeyColumnName,
            columnValue: primaryKey
        };
    };
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
            throw Error({code: 400, msg: `${table} is not a required item of ${tableName}`});
        }
    }
    // Make sure all non nullables have been included
    if(nonNullableCurrentAmount !== nonNullableNeededAmount) {
        throw Error({code: 400, msg: `Not all non-nullable required items have been included for ${tableName}`});
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
    const {
        allDataColumns,
        nonNullableReturnableIDs
    } = returnableIDLookup[tableName]
    // make sure all non nullable fields are included
    if(!nonNullableReturnableIDs.every(id => returnableIDs.includes(id))) throw Error({code: 400, msg: `Did not include a required field for ${tableName}`})
    // check each field
    returnableIDs.forEach((id, i) => {
        // is it one of the data columns?
        if(allDataColumns.includes(id)) {
            // list
            if(['item-list', 'obs-list'].includes(returnableIDLookup[id].rt__type_name)) {
                if(type(data[i]) !== 'array') throw Error({code: 400, msg: `returnableID ${id} must be of type: array`})
                // preset values
                data[i].forEach(val => {
                    if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(val)) throw Error({code: 400, msg: `${val} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`})
                })
            }
            // factor
            else if(['item-factor', 'obs-factor'].includes(returnableIDLookup[id].rt__type_name)) {
                // preset values
                if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(data[i])) throw Error({code: 400, msg: `${data[i]} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`})
            }
            // attribute
            else if(returnableIDLookup[id].rt__type_name === 'attribute') {
                if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(data[i])) throw Error({code: 400, msg: `${data[i]} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`})     
            }
            // other
            else {
                let correctType = sqlToJavascriptLookup[returnableIDLookup[id].sql__type_name.toLowerCase()]
                if(type(data[i]) !== correctType) throw Error({code: 400, msg: `returnableID ${id} must of of type: ${correctType}`})
            }
        } else {
            throw Error({code: 400, msg: `returnableID ${id} is not valid for ${tableName}`})
        }
    })
}
