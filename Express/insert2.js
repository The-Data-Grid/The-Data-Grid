// Database connection and SQL formatter
const {postgresClient} = require('../db/pg.js');
const type = require('@melgrove/type');
const formatSQL = postgresClient.format;
// get connection object
const db = postgresClient.getConnection.db
const {
    returnableIDLookup,
    itemM2M,
    dataColumnPresetLookup
} = require('./setup.js')


/*
    Static Objects
*/

const itemTypeIDLookup = {

}

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

        // PostgreSQL transaction
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

        })
    } catch(err) {
        return err
    }

    /*
        Helper Functions
    */

    /**
     * Inserts items into the database
     * @param {Object} options
     * @param {Array.<createItemObject>} options.createItemObjectArray
     * @param {Object} options.transaction database transaction
     * @returns {Array.<Number[]>} insertedItemPrimaryKeyLookup
     */
    async function createItem(options) {

        const {
            createItemObjectArray,
            transaction
        } = options

        // 1. Validate reqiured items and data fields for every item
        for(let createItemObject of createItemObjectArray) {
            const tableName = itemTypeIDLookup[createItemObject.itemTypeID]

            validateRequiredItems([
                ...requiredItems
                    .map(i => i.itemTypeID), 
                ...createItemObject.newRequiredItemIndices
                    .map(i => createItemObjectArray[i].itemTypeID)
            ], tableName)

            validateDataColumns(createItemObject.data, tableName)
        }

        // 2. Insert every item
        let currentInsertedItemPrimaryKeyLookup = createItemObjectArray.map(el => null)
        for(let i = 0; i < createItemObjectArray.length; i++) {
            currentInsertedItemPrimaryKeyLookup = await createIndividualItem(i, createItemObjectArray, currentInsertedItemPrimaryKeyLookup, transaction)
        }

        // sanity check
        if(currentInsertedItemPrimaryKeyLookup.some(el => el === null)) {
            throw Error(`Computer did not insert all the items! Here is the array: ${currentInsertedItemPrimaryKeyLookup}`)
        }

        return currentInsertedItemPrimaryKeyLookup

        /**
         * Inserts an item into the database
         * @param {Number} currentIndex
         * @param {createItemObject[]} createItemObjectArray
         * @param {Number[]} insertedItemPrimaryKeyLookup
         * @param {Object} db database transaction
         * @returns {Array.<?Number>} insertedItemPrimaryKeyLookup
         */
        async function createIndividualItem(currentIndex, createItemObjectArray, insertedItemPrimaryKeyLookup, db) {
            // get current createItemObject
            const createItemObject = createItemObjectArray[currentIndex]
            // unpack
            const tableName = itemTypeIDLookup[createItemObject.itemTypeID]
            let requiredItems = createItemObject.requiredItems
            let globalReference = null

            // handle global item reference
            if(createItemObject.globalPrimaryKey === null) {
                if(createItemObject.newGlobalIndex !== null) {
                    if(insertedItemPrimaryKeyLookup[createItemObject.newGlobalIndex] === null) {
                        // then referencing a new global item
                        insertedItemPrimaryKeyLookup = createItem(createItemObject.newGlobalIndex, createItemObjectArray, insertedItemPrimaryKeyLookup)
                    } else {
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
                    insertedItemPrimaryKeyLookup = createItem(index, createItemObjectArray, insertedItemPrimaryKeyLookup)
                } else {
                    // add to requiredItems
                    requiredItems.push({
                        itemTypeID: createItemObjectArray[index],
                        primaryKey: insertedItemPrimaryKeyLookup[index]
                    })
                }
            }



            // tableName
            // requiredItems
            // data
            // ?globalReference

            // first build the pg-promise query template
            const externalPrimaryKeys = await insertExternalDataColumns()

            // pass the values + computed fields into the template
            const template = makeSQLTemplate()

            // insert and get the primary key
            const itemPrimaryKey = await insertItem()

            insertedItemPrimaryKeyLookup[currentIndex] = itemPrimaryKey
            return insertedItemPrimaryKeyLookup

            /*
                Helper Functions
            */

            async function insertExternalDataColumns() {

            }

            function makeSQLTemplate() {

            }
            
            async function insertItem() {

            }
        }

        /*
            Helper Functions
        */

        /**
         * Validate the required items are correct. Throws an error if not
         * @param {Array} itemArray 
         * @param {string} tableName
         * @returns {undefined} 
         */
        function validateRequiredItems(itemArray, tableName) {

        }

        /**
         * Validate data types and preset values of data fields. Throws an error if not
         * @param {createItemObject.data} dataObject
         * @param {string} tableName
         * @returns {undefined} 
         */
        function validateDataColumns(dataObject) {
            const {returnableIDs, data} = dataObject
            let allDataColumns
            // make sure all non nullable fields are included
            if(!nonNullableReturnableIDs.every(id => returnableIDs.includes(id))) throw Error(`Did not include a required field for ${tableName}`)
            // check each field
            returnableIDs.forEach((id, i) => {
                // is it one of the data columns?
                if(allDataColumns.includes(id)) {
                    // list
                    if(['item-list', 'obs-list'].includes(returnableIDLookup[id].rt__type_name)) {
                        if(type(data[i]) !== 'array') throw Error(`returnableID ${id} must be of type: array`)
                        // preset values
                        data[i].forEach(val => {
                            if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(val)) throw Error(`${val} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`)
                        })
                    }
                    // factor
                    else if(['item-factor', 'obs-factor'].includes(returnableIDLookup[id].rt__type_name)) {
                        // preset values
                        if(!dataColumnPresetLookup[returnableIDLookup[id].c__column_id].includes(data[i])) throw Error(`${data[i]} is not a valid value for ${returnableIDLookup[id].c__frontend_name} of ${tableName}`)
                    }
                    // other
                    else {
                        let correctType = sqlToJavascriptLookup[returnableIDLookup[id].sql__type_name.toLowerCase()]
                        if(type(data[i]) !== correctType) throw Error(`returnableID ${id} must of of type: ${correctType}`)
                    }
                } else {
                    throw Error(`returnableID ${id} is not valid for ${tableName}`)
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

}

module.exports = insertSubmission