const {postgresClient} = require('../../pg.js');
const formatSQL = postgresClient.format;

const allInternalObjects = require("../../preprocess/load.js");

const {
    UpdateItemError,
    insertItemHistory,
    validateUpdateItemDataColumns,
    validateRequiredItemsOnUpdate,
    externalColumnInsertGenerator,
    updateItemManyToMany
} = require('../helpers.js');

// Generate external column insertion functions
const insertExternalColumn = {
    'attribute-mutable': externalColumnInsertGenerator('attribute_id', true, 'attribute', UpdateItemError),
    'attribute': externalColumnInsertGenerator('attribute_id', false, 'attribute', UpdateItemError),
    'item-factor-mutable': externalColumnInsertGenerator('factor_id', true, 'item-factor', UpdateItemError),
    'item-factor': externalColumnInsertGenerator('factor_id', false, 'item-factor', UpdateItemError),
    //'item-location': externalColumnInsertGenerator('location_id', false, 'item-location', UpdateItemError),
    'item-list': externalColumnInsertGenerator('list_id', false, 'item-list', UpdateItemError),
    'item-list-mutable': externalColumnInsertGenerator('list_id', true, 'item-list', UpdateItemError)
};

module.exports = updateItem;
/**
 * 
 * @param {Object} options 
 */
async function updateItem(options) {
    const {
        updateItemObjectArray,
        transaction,
        sessionObject,
        dbName,
    } = options;
    
    const internalObjects = allInternalObjects[dbName];
    const { itemTableNames } = internalObjects;

    const db = transaction;

    try {
        // Validate
        for(let updateItemObject of updateItemObjectArray) {
            const {
                itemTypeID,
                primaryKey,
                nonIDRequiredItems,
                data
            } = updateItemObject;

            const tableName = itemTableNames[itemTypeID];
            const requiredItemTableNames = nonIDRequiredItems.map(item => itemTableNames[item.itemTypeID]);
            const requiredItemPrimaryKeys = nonIDRequiredItems.map(item => item.primaryKey);

            // validate returnables
            validateUpdateItemDataColumns(data, tableName, dbName);

            // validate non id required items
            //     existence of type and non-id ness
            validateRequiredItemsOnUpdate(requiredItemTableNames, tableName, dbName);
            //     existence of item itself
            let i = 0;
            for(let tableName of requiredItemTableNames) {
                try {
                    const primaryKey = requiredItemPrimaryKeys[i];

                    await db.one(formatSQL(`
                        select item_id 
                        from $(tableName:name)
                        where item_id = $(primaryKey)
                    `, {
                        tableName,
                        primaryKey
                    }));

                } catch(err) {
                    console.log(err);
                    throw new UpdateItemError({code: 400, msg: `Item with primary key ${primaryKey} does not exist in ${tableName}`});
                }
                i++;
            }
        }
            
        console.log('Validated');

        // Update Every Item
        for(let updateItemObject of updateItemObjectArray) {
            await updateIndividualItem(updateItemObject, db);
        }
                
        console.log('Updated Every Item');

    } catch(err) {
        if(err instanceof UpdateItemError) {
            throw err;
        } else {
            throw new UpdateItemError({code: 500, msg: err});
        }
    }
}

async function updateIndividualItem(updateItemObject, db, dbName) {
    const internalObjects = allInternalObjects[dbName];
    const { itemTableNames, itemColumnObject, returnableIDLookup } = internalObjects;

    const {
        itemTypeID,
        primaryKey,
        nonIDRequiredItems,
        data
    } = updateItemObject;

    const tableName = itemTableNames[itemTypeID];
    const requiredItemTableNames = nonIDRequiredItems.map(item => itemTableNames[item.itemTypeID]);
    const requiredItemPrimaryKeys = nonIDRequiredItems.map(item => item.primaryKey);

    // Get all of the columns needed to insert the item
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
            primaryKeyAndColumnName.isLocation = false; // ** change this if you want to add location types to external columns
            columnNamesAndValues.push(primaryKeyAndColumnName);
        }
        // then a local column
        else {
            columnNamesAndValues.push({
                columnName: itemColumn.columnName,
                columnValue,
                isLocation: ['Point', 'LineString', 'Polygon'].includes(itemColumn.sqlType)
            });
        }
        i++;
    }

    // add required item references to columnNamesAndValues
    requiredItemTableNames.forEach((reference, i) => {
        // don't need to sanitize because we have validated with lookup and query
        columnNamesAndValues.push({
            columnName: reference + '_id',
            columnValue: requiredItemPrimaryKeys[i]
        });
    });

    // sanitize and format into UPDATE ... SET SQL format
    columnNamesAndValues = columnNamesAndValues.map(obj => {
        let { columnName, columnValue, isLocation } = obj;
        let pgPromiseColumnValueString = '$(columnValue)';
        // Wrap GeoJSON in PostGIS type converter for location types
        if(isLocation) {
            pgPromiseColumnValueString = `ST_GeomFromGeoJSON(${pgPromiseString})`;
        }
        return formatSQL(`$(columnName:name) = ${pgPromiseColumnValueString}`, {
            columnName,
            columnValue,
        });
    });

    // construct statement
    const columnNamesAndValuesSQL = columnNamesAndValues.join(', ');
    const fullSQLStatement = formatSQL(`
        UPDATE $(tableName:name) SET
        $(columnNamesAndValuesSQL:raw)
        WHERE item_id = $(primaryKey)
    `, {
        primaryKey,
        tableName,
        columnNamesAndValuesSQL
    });

    // run statement
    await db.none(fullSQLStatement);

    // Update list values
    for(let columnsAndValues of listColumnsAndValues) {
        const {itemColumn, columnValue} = columnsAndValues;
        // Insert into the list_... table
        const primaryKeyOfInsertedValue = await insertExternalColumn[itemColumn.referenceType](itemColumn.tableName, itemColumn.columnName, columnValue, db);
        // insert into the many to many table
        await updateItemManyToMany(primaryKeyOfInsertedValue.columnValue, primaryKey, itemColumn.tableName, db);
    }

    // Insert into history
    await insertItemHistory(tableName, 'update', primaryKey, db, dbName)
}