const express = require('express'); 
const router = express.Router(); //use router instead of app
// Database connection and SQL formatter
const {postgresClient} = require('../pg.js');
const { authorizeSubmission } = require('../auth/authorizer.js');
// get connection object
const db = postgresClient.getConnection.db
const { clearCache } = require('../query/cacheLayer.js');
// Handlers
const createItem = require('./item/createItem.js');
const updateItem = require('./item/updateItem.js');
const deleteItem = require('./item/deleteItem.js');
const createObservation = require('./observation/createObservation.js');
const updateObservation = require('./observation/updateObservation.js');
const deleteObservation = require('./observation/deleteObservation.js');
// Error classes
const {
    CreateItemError,
    CreateObservationError,
    DeleteObservationError,
    DeleteItemError,
    UpdateItemError,
    UpdateObservationError,
} = require('./helpers.js');
const errorClassArray = [CreateItemError, CreateObservationError, DeleteObservationError, DeleteItemError, UpdateItemError, UpdateObservationError];

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

    console.log(createItemObjectArray)

    // PostgreSQL transaction
    // must pass transaction database object to each helper
    await db.tx(async transaction => {
        await updateItem({
            updateItemObjectArray,
            transaction,
            sessionObject
        })
        
        await deleteItem({
            deleteItemObjectArray,
            requestPermanentDeletionItemObjectArray,
            transaction,
            sessionObject
        })

        await updateObservation({
            updateObservationObjectArray,
            transaction,
            sessionObject
        })

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
    console.log(req.session)
    try {
        await insertSubmission(req.body, res.locals.authorization);
        return res.status(201).end();
    } catch(err) {
        console.log("ERROR: ", err)
        if(errorClassArray.some(errorClass => err instanceof errorClass)) {
            return res.status(err.code).send(err.msg);
        } else {
            return res.status(500).send(err);
        }
    }
}

router.post('/', authorizeSubmission, insertSubmissionHandler);

module.exports = router;