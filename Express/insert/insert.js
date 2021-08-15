// Database connection and SQL formatter
const {postgresClient} = require('../db/pg.js');
// get connection object
const db = postgresClient.getConnection.db
// individual object handlers
const createItem = require('./item/createItem.js');
const { clearCache } = require('../query/cacheLayer.js');


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
async function insertSubmission(submissionObject, sessionObject) {

    const createItemObjectArray = submissionObject.items.create
    const updateItemObjectArray = submissionObject.items.update
    const deleteItemObjectArray = submissionObject.items.delete
    const requestPermanentDeletionItemObjectArray = submissionObject.items.requestPermanentDeletion
    const createObservationObjectArray = submissionObject.observations.create
    const updateObservationObjectArray = submissionObject.observations.update
    const deleteObservationObjectArray = submissionObject.observations.delete

    // JSON representation of item_history & observation_history
    let uploadReceipt = {}

    console.log(createItemObjectArray)

    // PostgreSQL transaction
    // must pass transaction database object to each helper
    await db.tx(async transaction => {
        /*
        await updateItem({
            updateItemObjectArray,
            transaction,
            sessionObject
        })
        */
        
        await deleteItem({
            deleteItemObjectArray,
            requestPermanentDeletionItemObjectArray,
            transaction,
            sessionObject
        })

        /*
        await updateObservation({
            updateObservationObjectArray,
            transaction,
            sessionObject
        })
        */

        await deleteObservation({
            deleteObservationObjectArray,
            transaction,
            sessionObject
        })

        
        const insertedItemPrimaryKeyLookup = await createItem({
            createItemObjectArray,
            transaction,
            sessionObject
        })

        
        await createObservation({
            createObservationObjectArray,
            insertedItemPrimaryKeyLookup,
            transaction,
            sessionObject
        })
        
        // clear the query cacheLayer
        clearCache();
    })
}

async function insertSubmissionHandler(req, res, next) {
    try {
        await insertSubmission(req.body, req.session);
        return res.status(201).end();
    } catch(err) {
        console.log("ERROR: ", err)
        if(err.msg instanceof Error) err.msg = err.msg.message;
        return res.status(err.code).send(err.msg);
    }
}

module.exports = {
    submission: insertSubmissionHandler
};