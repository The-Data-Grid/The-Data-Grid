// Database connection and SQL formatter
const {postgresClient} = require('../db/pg.js');
const type = require('@melgrove/type');
const formatSQL = postgresClient.format;
// get connection object
const db = postgresClient.getConnection.db
const {
    returnableIDLookup,
    itemM2M
} = require('./setup.js');



/*
    Static Objects
*/

// from setupObject, identifies type of item (ex. item_sink vs item_mirror)
// map between integer and table name
const itemTypeIDLookup = {

}

const observationReturnableLookup

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
Includes for all attribute, list, and factor
{
    columnID: [JS value, ...]
}
*/
const dataColumnPresetLookup = {

}

const sqlToJavascriptLookup = {
    numeric: 'number',
    integer: 'number',
    timestamptz: 'date',
    boolean: 'boolean',
    json: 'object',
    point: 'object',
    linestring: 'object',
    polygon: 'object'
}

/*
    Request Objects
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
 * A new collection of items and/or observations to be created/updated/deleted from the database
 * @typedef {Object} submissionObject 
 * @property {Object} items
 * @property {Array.<createItemObject>} items.create
 * @property {Array.<updateItemObject>} items.update
 * @property {Array.<deleteItemObject>} items.delete
 * @property {Array.<deleteItemObject>} items.requestPermanentDeletion
 * @property {Object} observations
 * @property {Array.<createObservationObject>} observations.create
 * @property {Array.<updateObservationObject>} observations.update
 * @property {Array.<deleteObservationObject>} observations.delete
 */




/**
 * Inserts items into the database
 * @param {Object} options
 * @param {Array.<createItemObject>} options.createItemObjectArray
 * @param {Object} options.transaction database transaction
 * @returns {Array.<Number[]>} insertedItemPrimaryKeyLookup
 */
async function createItem(options) {
/*
1. createItem()
    1. validateRequiredItems()
    2. validateDataColumns()
        1. dataColumnPresetLookup
    3. createIndividualItem()
        1. handle global
        2. handle self ref
        3. insertExternalDataColumns()
            1. insertList()
            2. insertFactor()
            3. insertLocation()
            4. insertAttribute()
        4. makeSQL()
        5. insertItem()
        6. insertHistory()
*/

    const {
        createItemObjectArray,
        transaction
    } = options

    // 1. Validate reqiured items and data fields for every item
    for(let createItemObject of createItemObjectArray) {
        const tableName = itemTypeIDLookup[createItemObject.itemTypeID]
        if(tableName === undefined) {
            throw Error({code: 400, msg: `itemTypeID: ${createItemObject.itemTypeID} is not valid`})
        }

        // TODO: make requiredItemLookup
        validateRequiredItems([
            ...createItemObject.requiredItems.map(el => itemTypeIDLookup[el.itemTypeID]), 
            ...createItemObject.newRequiredItemIndices.map(el => itemTypeIDLookup[createItemObjectArray[el].itemTypeID])
        ], tableName)

        // TODO: make dataColumnPresetLookup, add handling for mutible reference types
        validateDataColumns(createItemObject.data, tableName)
    }

    // 2. Insert every item
    let currentInsertedItemPrimaryKeyLookup = createItemObjectArray.map(el => null)
    for(let i = 0; i < createItemObjectArray.length; i++) {
        currentInsertedItemPrimaryKeyLookup = await createIndividualItem(i, createItemObjectArray, currentInsertedItemPrimaryKeyLookup, transaction)
    }

    // sanity check
    if(currentInsertedItemPrimaryKeyLookup.some(el => el === null)) {
        throw Error({code: 500, msg: `Computer did not insert all the items! Here is the array: ${currentInsertedItemPrimaryKeyLookup}`})
    }

    return currentInsertedItemPrimaryKeyLookup

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
     *   1. handle global
     *   2. handle self ref
     *   3. insertExternalDataColumns()
     *       1. 
     *       2. insertFactor()
     *       3. insertLocation()
     *       4. insertAttribute()
     *   4. makeSQL()
     *   5. insertItem()
     *   6. insertList()
     *   7. insertHistory()
     */
    async function createIndividualItem(currentIndex, createItemObjectArray, insertedItemPrimaryKeyLookup, db) {
        // first check if this item has already been recursively inserted, and skip if so
        if(insertedItemPrimaryKeyLookup[currentIndex] !== null) {
            return insertedItemPrimaryKeyLookup;
        }
        // get current createItemObject
        const createItemObject = createItemObjectArray[currentIndex]
        // unpack
        const tableName = itemTypeIDLookup[createItemObject.itemTypeID]
        let requiredItems = createItemObject.requiredItems
        let globalReference = null

        // handle global item reference
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

        // handle self-referenced items
        for(let index of createItemObject.newRequiredItemIndices) {
            // insert if not done yet
            if(insertedItemPrimaryKeyLookup[index] === null) {
                // insert and update lookup
                insertedItemPrimaryKeyLookup = createIndividualItem(index, createItemObjectArray, insertedItemPrimaryKeyLookup, db)
                // sanity check
                if(insertedItemPrimaryKeyLookup[index] === null) throw Error({code: 500, msg: `Error in required item recursion, createItemObject at index ${index} never got inserted`});
            }
            // add to requiredItems
            requiredItems.push({
                itemTypeID: createItemObjectArray[index],
                primaryKey: insertedItemPrimaryKeyLookup[index]
            })
            
        }



        // tableName
        // requiredItems
        // data
        // ?globalReference

        
        const externalPrimaryKeys = await insertExternalDataColumns(createItemObject.data);
        
        // first build the pg-promise query template
        const template = makeSQLTemplate()
        
        // pass the values + computed fields into the template
        // insert item and get the primary key
        const itemPrimaryKey = await insertItem()

        insertedItemPrimaryKeyLookup[currentIndex] = itemPrimaryKey
        return insertedItemPrimaryKeyLookup

        /*
            Helper Functions
        */

        async function insertExternalDataColumns(itemData) {

        }

        function makeSQLTemplate(itemData, externalPrimaryKeys) {

        }
        
        async function insertItem() {

        }
    }

    /*
        Helper Functions
    */

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
}

/**
 * 
 * @param {Object} options 
 */
async function updateItem(options) {

}

/**
 * 
 * @param {Object} options 
 */
async function deleteItem(options) {
    
}

/**
 * Inserts observations into the database
 * @param {Object} options 
 * @param {Array.<createObservationObject[]>} options.createObservationObjectArray
 * @param {Array.<Number[]>} options.insertedItemPrimaryKeyLookup
 * @param {Object} options.transaction database transaction
 */
async function createObservation(options) {
    
    const {
        createObservationObjectArray,
        insertedItemPrimaryKeyLookup,
        transaction
    } = options
}

/**
 * 
 * @param {Object} options 
 */
async function updateObservation(options) {
    
}

/**
 * 
 * @param {Object} options 
 */
async function deleteObservation(options) {
    
}


/**
 * Creates/Updates/Deletes items and/or observations from the database
 * @param {submissionObject} submissionObject 
 */
async function insertSubmission(submissionObject) {
    try {
        
        const createItemObjectArray = submissionObject.items.create
        const updateItemObjectArray = submissionObject.items.update
        const deleteItemObjectArray = submissionObject.items.delete
        const requestPermanentDeletionItemObjectArray = submissionObject.items.requestPermanentDeletion
        const createObservationObjectArray = submissionObject.observations.create
        const updateObservationObjectArray = submissionObject.observations.update
        const deleteObservationObjectArray = submissionObject.observations.delete

        // JSON representation of item_history & observation_history
        let uploadReceipt = {}

        // PostgreSQL transaction
        // must pass transaction database object to each helper
        await db.tx(async transaction => {
            
            await updateItem({
                updateItemObjectArray,
                transaction
            })
            
            await deleteItem({
                deleteItemObjectArray,
                requestPermanentDeletionItemObjectArray,
                transaction
            })

            await updateObservation({
                updateObservationObjectArray,
                transaction
            })

            await deleteObservation({
                deleteObservationObjectArray,
                transaction
            })

            const insertedItemPrimaryKeyLookup = await createItem({
                createItemObjectArray,
                transaction
            })

            await createObservation({
                createObservationObjectArray,
                insertedItemPrimaryKeyLookup,
                transaction
            })

            // clear the query cacheLayer
            // update dataColumnPresetLookup

        })
    } catch(err) {
        return err
    }
}


module.exports = insertSubmission