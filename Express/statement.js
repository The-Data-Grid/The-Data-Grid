const pgp = require("pg-promise");
const PS = pgp.PreparedStatement;

const referenceSelectionJoin = 'LEFT JOIN $(joinTable) AS $(joinAlias) ON $(originalAlias).$(originalColumn) = $(joinAlias).$(joinColumn)'
// joinTable
// joinAlias
// joinColumn
// originalAlias
// originalColumn


 // NEW CODE
//const {idColumnTableLookup, tableParents} = require('./setup.js');

////////////////////////////////////////////////////////////
// Query column to database table lookup table generation //
////////////////////////////////////////////////////////////

// Serves the functionality of tableLookup and setupTableLookup

// Select and Where clauses //
const select = {
    query: 'SELECT $(returnColumns:raw) FROM $(feature:name)'
};

const where = { // ex: {clause: 'AND', select: "item_sop.sop_name", operation: "=", filterValue: "Example SOP #1"}
    query: '$(clause:value) ($(condition:value))' 
};

const whereCondition = {
    query: '$(select:value) $(operation:value) $(filterValue)'
}

let submission = {
    query: 'INNER JOIN tdg_submission AS s0 ON $(feature:value).submission_id = tdg_submission.submission_id',
}



/*************
* Approach 1 *
*************/
var feature;
var subfeature;
var feature_item;
var list;
var list_m2m;

'SELECT list.data_elementname FROM list INNER JOIN list_m2m ON list_m2m.list_id = list.list_id'
'INNER JOIN subfeature ON subfeature.observation_id = list_m2m.observation_id;'

/*************
* Approach 2 *
**************/
var metadata_table;
var metadata_col;
var metadata_datatype;
var metadata_selector;

// How do we connect different metadata_tables? Still a little confused on how the metadata stuff works.
'SELECT metadata_col.information FROM metadata_col INNER JOIN metadata_table ON metadata_col.table_id = metadata_table.table_id;'

/////////////////////////////////
// Generate table join clauses //
/////////////////////////////////

// Serves functionality of statement.js. We can use the format from statement.js
// of ```tablename: {query: 'INNER JOIN...', dependencies: [] }```

/*
module.exports = {
    idColumnTableLookup,
    tableParents
};
*/



// Inputs //

let idColumnTableLookup = {
    id: {
            column: 'column name',
            table: 'table name', 
            feature: 'feature name',
            referenceColumn: 'column name', 
            referenceTable: 'table name', //null if type_name == local
            filterable: true, //BOOLEAN
            sqlType: 'NUMERIC'|'TEXT',
            refType: 'list'
        }
        //note that id is a string such as '3'
}; // if idColumnTableLookup.feature == null, it is a global table

let tableParents = {
/*  feature_toilet: null,
    subfeature_toilet_flushometer: 'feature_toilet',
    feature_urinal: 'null',
    subfeature_toilet_sensor: 'feature_toilet',
    subfeature_urinal_sensor: 'feature_urinal'
    ...
*/
    table_name: 'parent_table_name', //if root feature parent_table_name is NULL
};

let subfeatures = Object.keys(tableParents).filter(key => tableParents[key] !== null).map(key => [key, tableParents[key]]);



// iterate through subfeatures and create query for each one
// Javascript template literal syntax

let subfeatureJoin = {
    subfeatures[0]: {
        query: 'INNER JOIN $(subfeature[1]:value) ON $(subfeature[1]:value).table_id = $(subfeature[0]:value).parent_id',
        dependencies: [subfeature[1]]
    }
};

// every feature has a feature item, but not every subfeature has a feature item
let featureItemJoin = {
    feature: {
        if (subfeatures.map(subfeature => subfeature[0]).includes($(feature))) { // if feature is actually a subfeature
            query: 'INNER JOIN featureitem_$(feature) ON featureitem_$(feature).featureitem_id = subfeature_$(feature).featureitem_id'
        } else { // if feature is already top-level feature; every feature has a feature item, so this is the default
            query: 'INNER JOIN featureitem_$(feature) ON featureitem_$(feature).featureitem_id = feature_$(feature).featureitem_id'
        }
    }
};



// get all unique tables and features (if not null) from idColumnTableLookup
// not sure if the syntax for this is correct, particularly due to the part inside the brackets
//var tablesAndFeatures = new Set(idColumnTableLookup[id]);

// Feature //
/*

!!!
Feature, subfeature, and featureitem tables are joined only with the table name information. So a lookup
that inputs only the names of backend tables

>Within feature or subfeature
    subfeature_... -> ... -> feature_...
    feature_... (no join)

>Featureitem
    featureitem_... -> subfeature_... (or directly) -> feature_... 

!!! Location, item, and list tables are joined with table name, reference column name, 
    and reference table name information

>Location (??)
    location_... -> featureitem_... (sometimes)

*/
let makeLocation = (locationTableName, referenceTableName, referenceColumnName) => `INNER JOIN ${locationTableName} ON ${referenceTableName}.${referenceColumnName} = ${locationTableName}.location_id`
/*
>List
    list_... -> list_m2m_... -> feature_...
*/

/*
pgp.as.format('INNER JOIN $(listName:value)_m2m \
ON $(listName:value)_m2m.observation_id = $(referenceTable:value).$(referenceColumn:value) \
INNER JOIN $(listName:value) \
ON $(listName:value).list_id = $(listName:value)_m2m.list_id', {myTable: 'feature_toilet', myTable2: 'sldkfjds'})

let listName= "listName_" + referenceTable + referenceColumn;

if (table.includes("list_"))
{
    let listJoin = {
        feature: {
            listName : { //Join m2m to audit table then join 
                query: 'INNER JOIN $(listName:value)_m2m \
                        ON $(listName:value)_m2m.observation_id = $(referenceTable:value).$(referenceColumn:value) \
                        INNER JOIN $(listName:value) \
                        ON $(listName:value).list_id = $(listName:value)_m2m.list_id',
                dependencies: ['referenceTable']
            }
        }

    }
}
*/

// let listJoin = {
//     feature: {
//         listName_referenceTableName_referenceColumnName : { //Join m2m to audit table then join 
//             query: 'INNER JOIN $(listName:value)_m2m \
//                     ON $(listName:value)_m2m.observation_id = $(referenceTableName:value).$(referenceColumnName:value) \
//                     INNER JOIN $(listName:value) \
//                     ON $(listName:value).list_id = $(listName:value)_m2m.list_id',
//             dependencies: ['referenceTableName']
//         }
//     }
// }

/*
>Item
    item_... -> subfeature_... -> feature


*/
// Global //

// need to know foreign key and primary key 

// need to know which table references which

// Also know: What feature a table comes from or if it is global

// get all globalClauseObjects and all featureClauseObjects

// make tableNameSQLLookup from clauseObjects

//toilet: {...globalClauseObjects, ...toiletClauseObjects}


// Output

let tableNameSQLLookup = {
    feature1: { //ex: toilet and not feature_toilet
        table_name: {query: 'SQL', dependencies: []}
    }
}







module.exports = {
    select,
    where,
    whereCondition,
    referenceSelectionJoin,
    submission
}; //this will export everything to the query engine 