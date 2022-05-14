const {postgresClient} = require('../../pg.js');
const formatSQL = postgresClient.format;
const {
    returnableIDLookup,
    itemM2M,
    allItems,
    requiredItemLookup,
    itemColumnObject,
    itemTableNames
} = require('../../preprocess/load.js');

const {
    insertItemHistory,
    externalColumnInsertGenerator,
    CreateItemError,
    validateRequiredItems,
    validateItemDataColumns
} = require('../helpers.js');

// Generate external column insertion functions
const insertExternalColumn = {
    'attribute-mutable': externalColumnInsertGenerator('attribute_id', true, 'attribute', CreateItemError),
    'attribute': externalColumnInsertGenerator('attribute_id', false, 'attribute', CreateItemError),
    'item-factor-mutable': externalColumnInsertGenerator('factor_id', true, 'item-factor', CreateItemError),
    'item-factor': externalColumnInsertGenerator('factor_id', false, 'item-factor', CreateItemError),
    'item-location': externalColumnInsertGenerator('location_id', false, 'item-location', CreateItemError),
    'item-list': externalColumnInsertGenerator('list_id', false, 'item-list', CreateItemError),
    'item-list-mutable': externalColumnInsertGenerator('list_id', true, 'item-list', CreateItemError)
};

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
 * @property {Number} i__item_id 2
 * @property {String} ur__type_name
 * @property {String} qr__type_name
 * @property {String} up__privilege_name
 * @property {String} qp__privilege_name
 */

/********************
    Exported Function
*/

module.exports = createItem
/**
 * Inserts items into the database
 * @param {Object} options
 * @param {Array.<createItemObject>} options.createItemObjectArray
 * @param {Object} options.transaction database transaction
 * @returns {Number[]} insertedItemPrimaryKeyLookup
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
            ], tableName);
        
            // TODO: make dataColumnPresetLookup, add handling for mutible reference types
            // 2. Validate data columns
            validateItemDataColumns(createItemObject.data, tableName);
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
            throw err
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
        // I think this if statement is duplicative because validity was already checked
        if(relevantColumnIDs.includes(columnID)) {
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
                // if list add to list array and handle after item insert
                if(['item-list', 'item-list-mutable'].includes(itemColumn.referenceType)) {
                    listColumnsAndValues.push({
                        itemColumn,
                        columnValue
                    });
                    continue;
                }
                const primaryKeyAndColumnName = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);
                columnNamesAndValues.push(primaryKeyAndColumnName);
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
    //////// ^^ I don't think they exist!
    if(nonNullableColumnIDs.length !== 0) throw new CreateItemError({code: 400, msg: `Missing (${nonNullableColumnIDs.join(', ')}) non nullable column IDs for ${tableName}`});

    // 4. Make the finished SQL statement
    const fullSQLStatement = makeItemSQLStatement(tableName, columnNamesAndValues, globalReference, requiredItems);

    // 5. Attempt to insert into the database and get the primary key
    const itemPrimaryKey = (await db.one(fullSQLStatement)).item_id;

    // 6. Insert list values and list many to many values
    for(let columnsAndValues of listColumnsAndValues) {
        const {itemColumn, columnValue} = columnsAndValues;

        // 1. Insert into the list_... table
        const primaryKeyOfInsertedValue = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);

        // insert into the many to many table
        await insertItemManyToMany(primaryKeyOfInsertedValue.columnValue, itemPrimaryKey, itemColumn.tableName, db);
    }

    // 7. Insert insertion record into history tables
    await insertItemHistory(tableName, 'create', itemPrimaryKey, db);

    // Update the primary key lookup and return it
    insertedItemPrimaryKeyLookup[currentIndex] = itemPrimaryKey;
    return insertedItemPrimaryKeyLookup;
}

/**
 * Helpers
 */

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