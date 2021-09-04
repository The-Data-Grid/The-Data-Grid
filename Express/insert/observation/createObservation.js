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