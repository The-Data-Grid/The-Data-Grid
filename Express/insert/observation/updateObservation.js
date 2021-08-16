const {postgresClient} = require('../../db/pg.js');
const formatSQL = postgresClient.format;

const {
    itemTableNames,
    itemColumnObject,
    itemObservationTableNameLookup
} = require('../../setup.js');

const {
    UpdateObservationError,
    insertObservationHistory,
    validateUpdateObservationDataColumns,
    externalColumnInsertGenerator,
    updateObservationManyToMany,
    updateSOP
} = require('../helpers.js');

// Generate external column insertion functions
const insertExternalColumn = {
    'attribute-mutable': externalColumnInsertGenerator('attribute_id', true, 'attribute', UpdateObservationError),
    'attribute': externalColumnInsertGenerator('attribute_id', false, 'attribute', UpdateObservationError),
    'obs-factor-mutable': externalColumnInsertGenerator('factor_id', true, 'obs-factor', UpdateObservationError),
    'obs-factor': externalColumnInsertGenerator('factor_id', false, 'obs-factor', UpdateObservationError),
    'obs-list': externalColumnInsertGenerator('list_id', false, 'obs-list', UpdateObservationError),
    'obs-list-mutable': externalColumnInsertGenerator('list_id', true, 'obs-list', UpdateObservationError)
};

module.exports = updateObservation;
/**
 * 
 * @param {Object} options 
 */
async function updateObservation(options) {
    const {
        updateObservationObjectArray,
        transaction,
        sessionObject
    } = options;

    const db = transaction;

    try {
        // Validate
        for(let updateObservationObject of updateObservationObjectArray) {
            const {
                itemTypeID,
                observationPrimaryKey,
                data
            } = updateObservationObject;

            const tableName = itemTableNames[itemTypeID];

            // validate returnables
            validateUpdateObservationDataColumns(data, tableName);
        }
            
        console.log('Validated');

        // Update Every Item
        for(let updateObservationObject of updateObservationObjectArray) {
            await updateIndividualObservation(updateObservationObject, sessionObject, db);
        }
                
        console.log('Updated Every Observation');

    } catch(err) {
        if(err instanceof UpdateObservationError) {
            throw err;
        } else {
            throw new UpdateObservationError({code: 500, msg: err});
        }
    }
}

async function updateIndividualObservation(updateObservationObject, sessionObject, db) {
    const {
        itemTypeID,
        observationPrimaryKey,
        data
    } = updateObservationObject;

    const tableName = itemTableNames[itemTypeID];
    const observationTableName = itemObservationTableNameLookup[tableName];

    // Get all of the columns needed to insert the observation
    let itemColumns = itemColumnObject[tableName];
    itemColumns = itemColumns['c__column_id'].map((id, i) => ({
        columnID: id,
        columnName: itemColumns['c__column_name'][i],
        tableName: itemColumns['c__table_name'][i],
        isNullable: itemColumns['c__is_nullable'][i],
        referenceType: itemColumns['r__type_name'][i],
        isItem: itemColumns.isItem[i],
        isObservation: itemColumns.isObservation[i]
    }));
    const relevantColumnObjects = itemColumns.filter(col => col.isItem)

    // Insert values for updated columns
    let columnNamesAndValues = [];
    let listColumnsAndValues = [];
    let sopValue = null;
    let i = 0;
    for(let returnableID of data.returnableIDs) {
        // Convert returnableID to columnID
        const columnID = returnableIDLookup[returnableID].columnID;
        // Get data value
        const columnValue = data.data[i];
        // Get the column metadata
        const itemColumn = relevantColumnObjects.filter(col => col.columnID == columnID)[0];

        // if external then externally call and get back pk
        if(itemColumn.referenceType in insertExternalColumn) {
            // if list add to list array and handle after item insert
            if(['item-list', 'item-list-mutable'].includes(itemColumn.referenceType)) {
                listColumnsAndValues.push({
                    itemColumn,
                    columnValue
                });
                continue;
            }
            const primaryKeyAndColumnName = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);
            columnNamesAndValues.push(primaryKeyAndColumnName);
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
        // then a local column
        } else {
            // convert data_time_conducted field from MM-DD-YYYY to UTC
            if(itemColumn.referenceType === 'obs-global' && itemColumn.columnName === 'data_time_conducted') {
                try {
                    columnValue = apiDateToUTC(columnValue)
                } catch {
                    throw new UpdateObservationError({code: 400, msg: `${columnValue} must be in MM-DD-YYYY format`});
                }
            }
            columnNamesAndValues.push({
                columnName: itemColumn.columnName,
                columnValue
            });
        }
        i++;
    }

    // sanitize and format into UPDATE ... SET SQL format
    columnNamesAndValues = columnNamesAndValues.map(obj => {
        return formatSQL('$(columnName:name) = $(columnValue)', {
            columnName: obj.columnName,
            columnValue: obj.columnValue
        });
    });

    // construct statement
    const columnNamesAndValuesSQL = columnNamesAndValues.join(', ');
    const fullSQLStatement = formatSQL(`
        UPDATE $(observationTableName:name) SET
        $(columnNamesAndValuesSQL:raw)
        WHERE observation_id = $(observationPrimaryKey)
        RETURNING observation_count_id
    `, {
        observationPrimaryKey,
        observationTableName,
        columnNamesAndValuesSQL
    });

    // run statement
    const observationCount = (await db.one(fullSQLStatement)).observation_count_id;

    // Update list values
    for(let columnsAndValues of listColumnsAndValues) {
        const {itemColumn, columnValue} = columnsAndValues;
        // Insert into the list_... table
        const {primaryKeyOfInsertedValue} = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);
        // insert into the many to many table
        await updateObservationManyToMany(primaryKeyOfInsertedValue, observationPrimaryKey, itemColumn.tableName, db);
    }

    // Update SOP value if passed
    if(sopValue !== null) {
        await updateSOP(sopValue, sessionObject.organizationID, observationCount);
    }

    // Insert into history
    await insertObservationHistory(observationTableName, 'update', observationPrimaryKey);
}