// Database connection and SQL formatter
const postgresClient = require('../db/pg.js');
const db = postgresClient.connect('main')
const formatSQL = postgresClient.format;

/*
What objects are available to me? 

returnableIDLookup
featureParents


metadata_returnable, metadata_column, metadata_item



go through all the columns



insertSQLEngine
need table name and column names

*/
async function getColumns(referenceType, itemTableName) {
    console.log(formatSQL('select * from metadata_column as m join metadata_item as i on m.metadata_item_id = i.item_id join metadata_reference_type as r on m.reference_type = r.type_id where r.type_name = $(referenceType) AND i.table_name = $(itemTableName)', { 
        referenceType,
        itemTableName
    }))
    let data =  await db.any(formatSQL('select * from metadata_column as m join metadata_item as i on m.metadata_item_id = i.item_id join metadata_reference_type as r on m.reference_type = r.type_id where r.type_id = $(referenceType) AND i.table_name = $(itemTableName)', { 
        referenceType,
        itemTableName
    }));
    
};

console.log(getColumns('obs', 'item_toilet'))


let items = require('../setup.js').allItems;
let m2m = require('../setup.js').itemM2M;

//console.log(items)
