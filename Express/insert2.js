// Database connection and SQL formatter
const {postgresClient} = require('../db/pg.js');
const type = require('@melgrove/type');
const formatSQL = postgresClient.format;
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
 * Inserts an item into the database
 * @param {createItemObject[]} createItemObjectArray
 * @param {Number[]} insertedItemPrimaryKeyLookup
 * @returns {Array.<?Number>} insertedItemPrimaryKeyLookup
 */
function createItem(currentIndex, createItemObjectArray, insertedItemPrimaryKeyLookup) {

    // get current createItemObject
    const createItemObject = createItemObjectArray[currentIndex]
    // unpack
    const tableName = itemTypeIDLookup[createItemObject.itemTypeID]
    let requiredItems = createItemObject.requiredItems
    let globalReference = null

    // validate required items are correct
    validateRequiredItems([
        ...requiredItems
            .map(i => i.itemTypeID), 
        ...createItemObject.newRequiredItemIndices
            .map(i => createItemObjectArray[i].itemTypeID)
    ], tableName)
    // validate fields are correct
    validateDataColumns(createItemObject.data, tableName)

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

    // pass the values + computed fields into the template

    // insert and get the primary key

    insertedItemPrimaryKeyLookup[currentIndex] = resultPrimaryKey
    return insertedItemPrimaryKeyLookup

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

