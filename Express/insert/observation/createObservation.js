/**
 * Inserts observations into the database
 * @param {Object} options 
 * @param {Array.<createObservationObject[]>} options.createObservationObjectArray
 * @param {Array.<Number[]>} options.insertedItemPrimaryKeyLookup
 * @param {Object} options.transaction database transaction
 */

class CreateObservationError extends Error {
    constructor(errObject, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
    
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CreateItemError);
        }
    
        this.name = 'CreateItemError';
        // Custom debugging information
        this.code = errObject.code;
        this.msg = errObject.msg;
    }
}

/**
 * A new item to be inserted into the database
 * @typedef {Object} createObservationObject
 * @property {Number} itemTypeID
 * @property {Number | null} itemPrimaryKey
 * @property {Number | null} newItemIndex
 * @property {Number | null} globalPrimaryKey
 * @property {Number | null} newGlobalIndex
 * @property {Array.<{returnableIDs: Number[], data: Object}>} data
 */

module.exports = createObservation;
/**
 * Inserts observations into the database
 * @param {Object} options
 * @param {Array.<createItemObject>} options.createItemObjectArray
 * @param {Object} options.transaction database transaction
 * @param {Number[]} options.insertedItemPrimaryKeyLookup array of primary keys
 * @throws {CreateObservationError} HTTP error code and message
 * 
 * Steps:
 *   1. validateDataColumns()
 *   2. createIndividualObservation()
 */
async function createObservation(options) {
    
    const {
        createObservationObjectArray,
        insertedItemPrimaryKeyLookup,
        transaction
    } = options;

    

}