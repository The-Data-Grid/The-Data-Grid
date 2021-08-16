const {postgresClient} = require('../../db/pg.js');
const formatSQL = postgresClient.format;
const { apiDateToUTC } = require('../../parse.js');

const {
    returnableIDLookup,
    itemM2M,
    allItems,
    requiredItemLookup,
    itemColumnObject,
    itemTableNames,
    itemObservationTableNameLookup
} = require('../../setup.js');

const {
    CreateObservationError,
    validateObservationDataColumns,
    externalColumnInsertGenerator,
    insertObservationManyToMany,
    insertObservationHistory,
    insertSOP
} = require('../helpers.js');

// Generate external column insertion functions
const insertExternalColumn = {
    'attribute-mutable': externalColumnInsertGenerator('attribute_id', true, 'attribute', CreateObservationError),
    'attribute': externalColumnInsertGenerator('attribute_id', false, 'attribute', CreateObservationError),
    'obs-factor-mutable': externalColumnInsertGenerator('factor_id', true, 'obs-factor', CreateObservationError),
    'obs-factor': externalColumnInsertGenerator('factor_id', false, 'obs-factor', CreateObservationError),
    'obs-list': externalColumnInsertGenerator('list_id', false, 'obs-list', CreateObservationError),
    'obs-list-mutable': externalColumnInsertGenerator('list_id', true, 'obs-list', CreateObservationError)
};

/**
 * A new observation to be inserted into the database
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
 * @param {createObservationObject[]} options.createObservationObjectArray
 * @param {Object} options.transaction database transaction
 * @param {Number[]} options.insertedItemPrimaryKeyLookup array of primary keys
 * @throws {CreateObservationError} HTTP error code and message
 * 
 * Steps:
 *   1. validateDataColumns()
 *   2. createIndividualObservation()
 *      1. Get the relevant data column metadata for the observation
 *      2. Insert values into external columns
 */
async function createObservation(options) {
    
    const {
        createObservationObjectArray,
        insertedItemPrimaryKeyLookup,
        transaction,
        sessionObject
    } = options;

    try {
        // Validate data fields for every observation
        for(let createObservationObject of createObservationObjectArray) {
            const itemTableName = itemTableNames[createItemObject.itemTypeID];
            if(itemTableName === undefined) {
                throw new CreateObservationError({code: 400, msg: `itemTypeID: ${createItemObject.itemTypeID} is not valid`})
            }
            
            // TODO: make dataColumnPresetLookup, add handling for mutible reference types
            // 2. Validate data columns
            validateObservationDataColumns(createObservationObject.data, itemTableName);
        }

        console.log('Validated');

        for(let createObservationObject of createObservationObjectArray) {
            const itemTableName = itemTableNames[createItemObject.itemTypeID];
            const observationTableName = itemObservationTableNameLookup[itemTableName];
            await createIndividualObservation(createObservationObject, insertedItemPrimaryKeyLookup, itemTableName, observationTableName, sessionObject, transaction);
        }

        console.log('Done inserting observations');

    } catch(err) {
        if(err instanceof CreateObservationError) {
            throw err
        } else {
            throw new CreateObservationError({code: 500, msg: err})
        }
    }
}

/**
 * Helpers
 */


async function createIndividualObservation(createObservationObject, insertedItemPrimaryKeyLookup, itemTableName, observationTableName, sessionObject, db) {

    // get primary key of item and global if they are internal references
    let itemReference
    if(createObservationObject.itemPrimaryKey == null) {
        itemReference = insertedItemPrimaryKeyLookup[createObservationObject.newItemIndex];
    } else {
        itemReference = createObservationObject.itemPrimaryKey;
    }

    let globalReference
    if(createObservationObject.globalPrimaryKey == null) {
        globalReference = insertedItemPrimaryKeyLookup[createObservationObject.newGlobalIndex];
    } else {
        globalReference = createObservationObject.globalPrimaryKey;
    }

    // insert every observation
    // Get all of the columns needed to insert the item
    let itemColumns = itemColumnObject[itemTableName];
    itemColumns = itemColumns['c__column_id'].map((id, i) => ({
        columnID: id,
        columnName: itemColumns['c__column_name'][i],
        tableName: itemColumns['c__table_name'][i],
        isNullable: itemColumns['c__is_nullable'][i],
        referenceType: itemColumns['r__type_name'][i],
        frontendName: itemColumns['c__frontend_name'][i],
        isItem: itemColumns.isItem[i],
        isObservation: itemColumns.isObservation[i]
    }));

    const relevantColumnObjects = itemColumns.filter(col => col.isObservation)
    const relevantColumnIDs = relevantColumnObjects.map(col => col.columnID)
    const nonNullableColumnIDs = relevantColumnObjects.filter(col => !col.isNullable).map(col => col.columnID);

    // 3. Go through user supplied data columns and add column names and column values
    //    to the columnNamesAndValues array. For external data columns, either insert
    //    the value into the external table first and add the newly created primary key,
    //    or reference an existing primary key if the value already exists in the
    //    external table
    let columnNamesAndValues = [];
    let listColumnsAndValues = [];
    let sopValue;
    let i = 0
    for(let id of createObservationObject.data.returnableIDs) {
        // Convert returnableID to columnID
        const columnID = returnableIDLookup[id].columnID;
        // if the returnable is valid
        if(relevantColumnIDs.includes(columnID)) {
            // if nullable then remove from nullable list
            if(nonNullableColumnIDs.includes(columnID)) {
                const removalIndex = nonNullableColumnIDs.indexOf(columnID);
                nonNullableColumnIDs.splice(removalIndex, 1);
            }
            // get the column metadata
            const itemColumn = itemColumns.filter(col => col.columnID == columnID)[0];
            // get the user passed insertion value
            let columnValue = createItemObject.data.data[i];

            // if the column is external call the proper insertion function based on reference type and pass metadata and value
            if(itemColumn.referenceType in insertExternalColumn) {
                if(['item-list', 'item-list-mutable'].includes(itemColumn.referenceType)) {
                    listColumnsAndValues.push({
                        itemColumn,
                        columnValue
                    });
                    continue;
                }
                const primaryKeyAndColumnName = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);
                columnNamesAndValues.push(primaryKeyAndColumnName);
            // if list add to list array and handle after item insert
            // handle auditor and sop special types
            } else if(itemColumn.referenceType == 'special') {
                if(itemColumn.frontendName === 'Auditor Name') {
                    // always text, never user reference for now
                    columnNamesAndValues.push({
                        columnName: itemColumn.columnName,
                        columnValue
                    });
                } else if(itemColumn.frontendName === 'Standard Operating Procedure') {
                    sopValue = columnValue;
                } else {
                    throw new CreateObservationError({code: 500, msg: 'Data column with reference type `special` found with invalid column name: ' + itemColumn.columnName});
                }
            // then a local column (obs-global is included)
            } else {
                // convert data_time_conducted field from MM-DD-YYYY to UTC
                if(itemColumn.referenceType === 'obs-global' && itemColumn.columnName === 'data_time_conducted') {
                    try {
                        columnValue = apiDateToUTC(columnValue)
                    } catch {
                        throw new CreateObservationError({code: 400, msg: `${columnValue} must be in MM-DD-YYYY format`});
                    }
                }
                columnNamesAndValues.push({
                    columnName: itemColumn.columnName,
                    columnValue
                });
            }
        // then not valid
        } else {
            throw new CreateObservationError({code: 400, msg: `returnableID ${id} is not valid for ${observationTableName}`});
        }
        i++;
    }

    // Insert and get observation count
    const observationCountReference = (await db.one(`
        insert into tdg_observation_count 
            (observation_count_id) 
            values 
            (default) 
                returning observation_count_id
    `)).observation_count_id;

    // Make the SQL Statement
    const fullSQLStatement = makeObservationSQLStatement(observationTableName, columnNamesAndValues, globalReference, itemReference, observationCountReference);

    // Attempt to insert the observation
    const observationPrimaryKey = (await db.one(fullSQLStatement)).observation_id;

    // Insert list values and list many to many values
    for(let columnsAndValues of listColumnsAndValues) {
        const { itemColumn, columnValue } = columnsAndValues;

        // 1. Insert into the list_... table
        const { primaryKeyOfInsertedValue } = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);

        // insert into the many to many table
        await insertObservationManyToMany(primaryKeyOfInsertedValue, observationPrimaryKey, itemColumn.tableName, db);
    }

    // Insert into SOP many to many
    await insertSOP(sopValue, sessionObject.organizationID, observationCountReference);

    // 7. Insert insertion record into history tables
    await insertObservationHistory(observationTableName, 'create', observationPrimaryKey);
}

/**
 * @param {String} tableName 
 * @param {Array.<{columnName: String, columnValue: String|Number|Date|Object|Boolean}>} columnNamesAndValues 
 * @param {Number|null} globalReference 
 */
function makeObservationSQLStatement(tableName, columnNamesAndValues, globalReference, itemReference, observationCountReference) {
    // add global reference
    columnNamesAndValues.push({
        columnName: 'global_id',
        columnValue: globalReference
    });

    // add parent item reference
    columnNamesAndValues.push({
        columnName: 'observableitem_id',
        columnValue: itemReference
    });

    // add the observation count
    columnNamesAndValues.push({
        columnName: 'observation_count_id',
        columnValue: observationCountReference
    });
    
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
                RETURNING "observation_id"
    `, {
        tableName,
        columnNamesSQL,
        columnValuesSQL
    });

    return fullInsertSQL;
}