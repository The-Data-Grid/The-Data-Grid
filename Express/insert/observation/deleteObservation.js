const {
    itemTableNames
} = require('../../preprocess/load.js');

const {
    DeleteObservationError,
    insertObservationHistory
} = require('../helpers.js');

const {postgresClient} = require('../../pg.js');
const formatSQL = postgresClient.format;

module.exports = deleteObservation;
/**
 * 
 * @param {Object} options 
 */
async function deleteObservation(options) {
    const {
        deleteObservationObjectArray,
        transaction,
        sessionObject
    } = options;

    const db = transaction;

    for(let deleteObservationObject of deleteObservationObjectArray) {
        const {
            itemTypeID,
            observationPrimaryKey
        } = deleteObservationObject;
        const itemTableName = itemTableNames[itemTypeID];
        const observationTableName = itemObservationTableNameLookup[itemTableName];
        let deletedPrimaryKey;

        try {
            // We don't need to do anything else here because all of the many to manys
            // which reference this table have `ON DELETE CASCADE`, which will delete
            // them automatically (https://stackoverflow.com/questions/14182079/delete-rows-with-foreign-key-in-postgresql)
            const deletedObservation = (await db.one(formatSQL(`
                delete from $(observationTableName:name)
                where observation_id = $(observationPrimaryKey)
                returning observation_count_id, observation_id
            `, {
                observationTableName,
                observationPrimaryKey
            })));

            const observationCountID = deletedObservation.observation_count_id;
            deletedPrimaryKey = deletedObservation.observation_id;
    
            // delete observation_count_id. This will trigger deletes in SOP and Auditor m2m's
            // because of `ON DELETE CASCADE`
            await formatSQL(`
                delete from tdg_observation_count
                where observation_count_id = $(observationCountID)
            `, {
                observationCountID
            });
    
            console.log('Successful deletion')

        } catch(err) {
            console.log(err);
            throw new DeleteObservationError({err: 400, msg: `Observation with ID ${observationPrimaryKey} does not exist in table ${observationTableName}`});
        }

        try {
            await insertObservationHistory(observationTableName, 'delete', deletedPrimaryKey, db);
        } catch(err) {
            console.log(err);
            throw new DeleteObservationError({err: 500, msg: 'Error when inserting deletion into history table'})
        }
    }
}