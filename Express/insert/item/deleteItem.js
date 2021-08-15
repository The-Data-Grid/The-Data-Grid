const {
    itemTableNames,
    itemObservationTableNameLookup
} = require('../../setup.js');

const {
    DeleteItemError,
    insertItemHistory
} = require('../helpers.js');

const {postgresClient} = require('../../db/pg.js');
const formatSQL = postgresClient.format;

module.exports = deleteItem;
/**
 * 
 * @param {Object} options 
 */
async function deleteItem(options) {
    const {
        deleteItemObjectArray,
        requestPermanentDeletionItemObjectArray,
        transaction,
        sessionObject
    } = options;

    const db = transaction;
    // Simply set `is_existing` to false
    for(let deleteItemObject of deleteItemObjectArray) {
        const {
            itemTypeID,
            primaryKey
        } = deleteItemObject;
        const tableName = itemTableNames[itemTypeID];

        try {

            await db.none(formatSQL(`
                update $(tableName:name)
                set is_existing = false
                where item_id = $(primaryKey)
            `, {
                tableName,
                primaryKey
            }));

        } catch(err) {
            console.log(err);
            throw new DeleteItemError({code: 500, msg: `Error when setting 'is_existing' to false for item ${tableName} with ID ${primaryKey}`})
        }

        try {
            await insertItemHistory(tableName, 'delete', itemPrimaryKey);
        } catch(err) {
            console.log(err);
            throw new DeleteItemError({code: 500, msg: 'Error when inserting deletion into history table'});
        }
    }

    // Request to permanently delete the item
    for(let deleteItemObject of requestPermanentDeletionItemObjectArray) {
        const {
            itemTypeID,
            primaryKey
        } = deleteItemObject;
        const itemTableName = itemTableNames[itemTypeID];
        const observationTableName = itemObservationTableNameLookup[itemTableName];
        let deletedItemID;

        try {

            // Check for referencing observations
            let observationCheck = (await db.any(formatSQL(`
                select o.observation_id as "observationID" from $(itemTableName:name) as i
                right join $(observationTableName:name) as o on o.observableitem_id = i.item_id
                where i.item_id = $(primaryKey)
            `, {
                primaryKey,
                itemTabeName,
                observationTableName
            }))).map(obs => obs.observationID);

            // if existing observations associated with item
            if(observationCheck.length > 0) {
                throw new DeleteItemError({code: 400, msg: `Permanent Deletion Request Rejected: Observations of the item you requested to delete ${itemTableName} exist with IDs: ${observationCheck.join(', ')} in table ${observationTableName}. You must delete them first to continue.`})
            }
    
            // We don't need to do anything else here because all of the many to manys
            // which reference this table have `ON DELETE CASCADE`, which will delete
            // them automatically (https://stackoverflow.com/questions/14182079/delete-rows-with-foreign-key-in-postgresql)
            const itemID = (await db.one(formatSQL(`
                delete from $(itemTableName:name)
                where item_id = $(primaryKey)
                returning item_id
            `, {
                itemTableName,
                primaryKey
            }))).item_id;

            deletedItemID = itemID;
    
            console.log('Successful permanent deletion')
        } catch(err) {
            // Will throw if the primary key doesn't exist or if there is constraint error,
            // which will happen when there are child items that reference the item attempting
            // to be deleted
            console.log(err)
            throw new DeleteItemError({err: 400, msg: `Permanent Deletion Request Rejected: Either item with ID ${primaryKey} does not exist in table ${tableName}, or the item has existing child items that reference it`})
        }

        try {
            await insertItemHistory(itemTableName, 'permanent-deletion', deletedItemID);
        } catch(err) {
            console.log(err);
            throw new DeleteItemError({err: 500, msg: 'Error when inserting permanent deletion into history table'});
        }
    }
}