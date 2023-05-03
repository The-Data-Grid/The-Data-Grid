const {postgresClient} = require('../../pg.js');
const formatSQL = postgresClient.format;

const allInternalObjects = require("../../preprocess/load.js");

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
        sessionObject,
        dbName,
    } = options;
    
    const { internalObjects } = allInternalObjects[dbName];
    const { itemTableNames, itemObservationTableNameLookup } = internalObjects;
    
    try {
        // Validate data fields for every observation
        for(let createObservationObject of createObservationObjectArray) {
            const itemTableName = itemTableNames[createObservationObject.itemTypeID];
            if(itemTableName === undefined) {
                throw new CreateObservationError({code: 400, msg: `itemTypeID: ${createObservationObject.itemTypeID} is not valid`})
            }
            
            // TODO: make dataColumnPresetLookup, add handling for mutible reference types
            // 2. Validate data columns
            validateObservationDataColumns(createObservationObject.data, itemTableName, dbName);
        }

        console.log('Validated Observations');
        var timer = Date.now();
        for(let i = 0; i < createObservationObjectArray.length; i++) {
            if(i % 100 == 0) {
                console.log(`Inserted ${i}/${createObservationObjectArray.length} 50,000 row chunks`);
                if(i === 1000) {
                    console.log(`
                        Note: If inserting many values in the same table, it is much faster to set 
                        \`observations.create.data.multiple: true\` and include them all in the same
                        \`observations.create.data.data\` array, instead of creating many objects in
                        the \`observations.create\` array.
                    `);
                }
            }
            let createObservationObject = createObservationObjectArray[i];
            const itemTableName = itemTableNames[createObservationObject.itemTypeID];
            const observationTableName = itemObservationTableNameLookup[itemTableName];
            // if more than 10k rows are attempting to be inserted in a single object
            // split it into multiple insertions
            const batchSize = 10_000
            if(createObservationObject.data.multiple && createObservationObject.data.data.length > batchSize) {
                let sliceIndex = 0;
                while(sliceIndex < createObservationObject.data.data.length) {
                    let { itemTypeID, itemPrimaryKey, newItemIndex, globalPrimaryKey, newGlobalIndex } = createObservationObject;
                    let { multiple, returnableIDs } = createObservationObject.data;
                    let newCreateObservationObject = {
                        itemTypeID,
                        itemPrimaryKey,
                        newItemIndex,
                        globalPrimaryKey,
                        newGlobalIndex,
                        data: {
                            multiple,
                            returnableIDs
                        }
                    }
                    newCreateObservationObject.data.data = createObservationObject.data.data.slice(sliceIndex, sliceIndex + batchSize);
                    await createIndividualObservation(newCreateObservationObject, insertedItemPrimaryKeyLookup, itemTableName, observationTableName, sessionObject, transaction, dbName);
                    console.log(`Inserted rows ${sliceIndex} to ${sliceIndex + batchSize < createObservationObject.data.data.length ? sliceIndex + batchSize : createObservationObject.data.data.length} of chunk ${i+1}`);
                    sliceIndex += batchSize;
                }
            } else {
                await createIndividualObservation(createObservationObject, insertedItemPrimaryKeyLookup, itemTableName, observationTableName, sessionObject, transaction, dbName);
            }
        }

        console.log(`Done inserting observations in ${Date.now() - timer} ms`);

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


async function createIndividualObservation(createObservationObject, insertedItemPrimaryKeyLookup, itemTableName, observationTableName, sessionObject, db, dbName) {
    const { internalObjects } = allInternalObjects[dbName];
    const { returnableIDLookup, itemColumnObject } = internalObjects;
    
    let curr = Date.now();
    function timer(id) {
        let cur = Date.now();
        console.log(String(id) + ': ' + String(cur - curr) + 'ms');
        curr = cur;
    }
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
        selectorType: itemColumns['sn__selector_name'][i],
        isItem: itemColumns.isItem[i],
        isObservation: itemColumns.isObservation[i]
    }));
    
    const relevantColumnObjects = itemColumns.filter(col => col.isObservation)
    const relevantColumnIDs = relevantColumnObjects.map(col => col.columnID)
    const nonNullableColumnIDs = relevantColumnObjects.filter(col => !col.isNullable).map(col => col.columnID);
    
    // 3. Go through user supplied data columns and add column names and column values
    //    to the columnNameValueMap object. For external data columns, either insert
    //    the value into the external table first and add the newly created primary key,
    //    or reference an existing primary key if the value already exists in the
    //    external table
    const isMultiple = createObservationObject.data.multiple === true;
    const data = isMultiple ? createObservationObject.data.data : [createObservationObject.data.data];
    // timer(1)
    let {
        columnNameValueMap,
        listColumnsAndValues,
        sopValue
    } = await getColumnsAndValues(createObservationObject.data.returnableIDs, data);
    // timer(2)
    // Make the SQL Statement
    const fullSQLStatement = makeObservationSQLStatement(observationTableName, columnNameValueMap, globalReference, itemReference);

    // Attempt to insert the observation
    const returnedIDs = (await db.any(fullSQLStatement));
    let observationPrimaryKeys = returnedIDs.map(obj => obj.observation_id);
    let observationCountReferences = returnedIDs.map(obj => obj.observaiton_count_id);
    // timer(3)

    // Insert list values and list many to many values
    for(let columnsAndValues of listColumnsAndValues) {
        const { itemColumn, columnValues } = columnsAndValues;

        // 1. Insert into the list_... table
        const primaryKeyOfInsertedValue = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValues, db);

        // insert into the many to many table
        let values = primaryKeyOfInsertedValue.columnValues.map(obj => obj.columnValue);
        // sanity check
        if(values.length !== observationPrimaryKeys.length) {
            throw new CreateObservationError({code: 500, msg: `Number of list values is different than number of list target keys`});
        }
        await insertObservationManyToMany(values, observationPrimaryKeys, itemColumn.tableName, db);
    }
    // timer(4)
    // Insert into SOP many to many
    await insertSOP(sopValue, observationCountReferences, globalReference, db);

    // 7. Insert insertion record into history tables
    await insertObservationHistory(observationTableName, 'create', observationPrimaryKeys, db, dbName);
    // timer(5)
    // Leaving inside so it has access to scope of createIndividualObservation()
    async function getColumnsAndValues(returnableIDs, data) {
        let columnNameValueMap = {};
        let listColumnsAndValues = [];
        let sopValue = [];
        for(let i = 0; i < returnableIDs.length; i++) {
            const id = returnableIDs[i];
            // Convert returnableID to columnID
            const columnID = returnableIDLookup[id].columnID;
            // if the returnable is valid
            if(!relevantColumnIDs.includes(columnID)) {
                throw new CreateObservationError({code: 400, msg: `returnableID ${id} is not valid for ${observationTableName}`});
            }
            // if nullable then remove from nullable list
            if(nonNullableColumnIDs.includes(columnID)) {
                const removalIndex = nonNullableColumnIDs.indexOf(columnID);
                nonNullableColumnIDs.splice(removalIndex, 1);
            }
            // get the column metadata
            const itemColumn = itemColumns.filter(col => col.columnID == columnID)[0];

            // decide which way all of the data values are handled
            // 1 = external list
            // 2 = external factor or attribute
            // 3 = Auditor
            // 4 = SOP
            // 5 = all local columns
            let columnValueHandler;
            if(['obs-list', 'obs-list-mutable'].includes(itemColumn.referenceType)) {
                columnValueHandler = columnValueHandlerConstructor(1, i, itemColumn);
            } else if(['obs-factor', 'obs-factor-mutable', 'attribute'].includes(itemColumn.referenceType)) {
                columnValueHandler = columnValueHandlerConstructor(2, i, itemColumn);
            } else if(itemColumn.referenceType == 'special') {
                if(itemColumn.frontendName === 'Auditor') {
                    columnValueHandler = columnValueHandlerConstructor(3, i, itemColumn);
                } else if(itemColumn.frontendName === 'Standard Operating Procedure') {
                    columnValueHandler = columnValueHandlerConstructor(4, i, itemColumn);
                } else {
                    throw new CreateObservationError({code: 500, msg: 'Data column with reference type `special` found with invalid column name: ' + itemColumn.columnName});
                }
            } else {
                columnValueHandler = columnValueHandlerConstructor(5, i, itemColumn);
            }

            await columnValueHandler(data);
        }
        return {
            columnNameValueMap,
            listColumnsAndValues,
            sopValue,
        };
        
        function columnValueHandlerConstructor(handleType, columnIndex, itemColumn) {
            if(handleType == 1) {
                return async (data) => {
                    listColumnsAndValues.push({});
                    const listIndex = listColumnsAndValues.length - 1;
                    listColumnsAndValues[listIndex].itemColumn = itemColumn;
                    listColumnsAndValues[listIndex].columnValues = [];
                    // if list add to list array and handle after item insert
                    for(let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                        listColumnsAndValues[listIndex].columnValues.push(data[rowIndex][columnIndex]);
                    }
                };
            } else if(handleType == 2) {
                return async (data) => {
                    let columnValues = [];
                    for(let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                        columnValues.push(data[rowIndex][columnIndex]);
                    }
                    const primaryKeysAndColumnName = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValues, db);
                    columnNameValueMap[primaryKeysAndColumnName.columnName] = primaryKeysAndColumnName.columnValues;
                };
            } else if(handleType == 3 || handleType == 5) {
                return async (data) => {
                    columnNameValueMap[itemColumn.columnName] = [];
                    const isLocation = ['geoPoint', 'geoLine', 'geoRegion'].includes(itemColumn.selectorType);
                    // Auditor: always text, never user reference for now
                    // All local columns
                    for(let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                        columnNameValueMap[itemColumn.columnName].push({
                            columnValue: data[rowIndex][columnIndex],
                            isLocation,
                        });
                    }
                };
            } else if(handleType == 4) {
                return async (data) => {
                    for(let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                        sopValue.push(data[rowIndex][columnIndex]);
                    }
                }
            } else {
                throw new CreateObservationError({code: 500, msg: `Invalid handleType: ${handleType} passed to columnValueHandlerConstructor`});
            }
        }
    }
}

/**
 * @param {String} tableName 
 * @param {Array.<{columnName: String, columnValue: String|Number|Date|Object|Boolean}>} columnNameValueMap 
 * @param {Number|null} globalReference 
 */
function makeObservationSQLStatement(tableName, columnNameValueMap, globalReference, itemReference) {

    // make the column names SQL string
    let columnNamesSQL = [];
    Object.keys(columnNameValueMap).forEach(name => {
        columnNamesSQL.push(formatSQL('$(columnName:name)', {
            columnName: name
        }));
    });
    columnNamesSQL = '( ' + columnNamesSQL.join(', ') + ', global_id, observableitem_id, observation_count_id )';

    // make the column values SQL string'
    let columnValuesSQL = '';
    for(let rowIndex = 0; rowIndex < Object.values(columnNameValueMap)[0].length; rowIndex++) {
        columnValuesSQL += ',' + makeColumnValuesSQL(columnNameValueMap, rowIndex);
    }   
    // remove the first comma
    columnValuesSQL = columnValuesSQL.slice(1);

    // make the full statement and return it
    const fullInsertSQL = formatSQL(`
    INSERT INTO $(tableName:name) 
    $(columnNamesSQL:raw) 
    VALUES $(columnValuesSQL:raw)
    RETURNING "observation_id", "observation_count_id"
    `, {
        tableName,
        columnNamesSQL,
        columnValuesSQL
    });
    
    return fullInsertSQL;

    function makeColumnValuesSQL(columnNameValueMap, rowIndex) {
        columnValuesSQL = [];
        Object.values(columnNameValueMap).forEach(col => {
            let { columnValue, isLocation } = col[rowIndex];
            let pgPromiseString = '$(columnValue)';
            // Wrap GeoJSON in PostGIS type converter for location types
            if(isLocation) {
                pgPromiseString = `ST_GeomFromGeoJSON(${pgPromiseString})`;
            }
            columnValuesSQL.push(formatSQL(pgPromiseString, {
                columnValue
            }));
        });
        appendedColumnValuesSQL = formatSQL(`, $(globalReference), $(itemReference), nextval('tdg_observation_count_observation_count_id_seq') - 1`, {
            globalReference,
            itemReference,
        });
        return '( ' + columnValuesSQL.join(', ') + appendedColumnValuesSQL + ' )';
    }
}