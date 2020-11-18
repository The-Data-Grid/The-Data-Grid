const pgp = require("pg-promise");
const PS = pgp.PreparedStatement;

const referenceSelectionJoin = 'LEFT JOIN $(joinTable:value) AS $(joinAlias:value) ON $(originalAlias:value).$(originalColumn:value) = $(joinAlias:value).$(joinColumn:value)'
// joinTable
// joinAlias
// joinColumn
// originalAlias
// originalColumn

const sorta = 'ORDER BY $(columnName:value) ASC'

const sortd = 'ORDER BY $(columnName:value) DESC'

const limit = 'LIMIT $(limit)'

const offset = 'OFFSET $(offset)'


 // NEW CODE
//const {idColumnTableLookup, tableParents} = require('./setup.js');

////////////////////////////////////////////////////////////
// Query column to database table lookup table generation //
////////////////////////////////////////////////////////////

// Serves the functionality of tableLookup and setupTableLookup

// Select and Where clauses //
const select = 'SELECT $(returnColumns:raw) FROM $(feature:name)'

// ex: {clause: 'AND', select: "item_sop.sop_name", operation: "=", filterValue: "Example SOP #1"}
const where = '$(clause:value) ($(condition:raw))'

const whereCondition = '$(select:value) $(operation:value) $(filterValue)';

const submission = 'LEFT JOIN item_submission ON $(feature:name).submission_id = item_submission.submission_id AS submission';


// STATS //

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


const subfeatureJoin = 'INNER JOIN $(subfeature:value) ON $(subfeature:value).parent_id = $(feature:value).observation_id';
const rootFeatureJoin = 'FROM $(rootFeature:value)';

// iterate through subfeatures and create query for each one
// Javascript template literal syntax
/*

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

*/

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

// pgp.as.format('SELECT + FROM $(referenceTable:value)', {myTable: 'referenceColumn'});

//pgp.as.format() , two parameter, takes a statement like 'select + from $(myTable:value)', (myTable:'feature_toliet')

/*
    let listJoin = {
        //change feature 
        featureName: {
            listName : { //Join m2m to audit table then join 
                //use id column lookup to construct array of queries
                //given 9 tables, generate 9 statements
                query: pgp.as.format('SELECT + FROM $(referenceTable:value)', 
                {referenceTable: idColumnTableLookup.referenceTable, referenceColumn: idColumnTableLookup.referenceColumn}),

                //many to many to the list and  many to many to the feature table
                // query: 'INNER JOIN $(listName:value)_m2m \
                //         ON $(listName:value)_m2m.observation_id = $(referenceTable:value).$(referenceColumn:value) \
                //         INNER JOIN $(listName:value) \
                //         ON $(listName:value).list_id = $(listName:value)_m2m.list_id'
                
                dependencies: ['referenceTable']
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

// Old construct.js

// SQL //
// ============================================================

// newCreateList: SQL for creating a new list_m2m table

const newCreateListm2m = 'CREATE TABLE $(tableName:value) (\
    observation_id INTEGER NOT NULL,\
    list_id INTEGER NOT NULL)'

// newCreateList: SQL for creating a new list table

const newCreateList = 'CREATE TABLE $(tableName:value) (\
    list_id SERIAL PRIMARY KEY,\
    $(columnName:value) $(sqlDatatype:value) NOT NULL)'

// newAddColumn: SQL for adding a column to an existing table

const newAddColumn = 'ALTER TABLE $(tableName:value) ADD COLUMN $(columnName:value) $(sqlDatatype:value) $(nullable:value)'

// reference: SQL for making one column reference another

var reference = 'ALTER TABLE $(fkTable:value) \
                  ADD FOREIGN KEY ($(fkCol:value)) \
                  REFERENCES $(pkTable:value) ($(pkCol:value))';

// newCreateFeature: SQL for creating new feature table

var newCreateFeature = 
        'CREATE TABLE $(feature:value) (\
            observation_id SERIAL PRIMARY KEY,\
            observation_count_id INTEGER NOT NULL, \
            submission_id INTEGER NOT NULL,\
            featureitem_id INTEGER NOT NULL)'

// newCreateSubfeature: SQL for creating new subfeature table

var newCreateSubfeature = {
    withFeatureItem: 'CREATE TABLE $(feature:value) (\
        parent_id INTEGER NOT NULL, \
        observation_id SERIAL PRIMARY KEY,\
        observation_count_id INTEGER NOT NULL, \
        featureitem_id INTEGER NOT NULL)',
    withoutFeatureItem: 'CREATE TABLE $(feature:value) (\
        parent_id INTEGER NOT NULL, \
        observation_id SERIAL PRIMARY KEY,\
        observation_count_id INTEGER NOT NULL)'
};

// newCreateFeatureItem: SQL for creating new feature item table
// TODO: add unique constraint to group of ID columns

var newCreateFeatureItem = 
        'CREATE TABLE $(feature:value) ( \
            item_id SERIAL PRIMARY KEY, \
            $(location:value) INTEGER NOT NULL)';

// newMetadataFeature: SQL for inserting one row to
// the metadata_feature table, representing a feature (which has no parent)

var newMetadataFeature =
				'INSERT INTO metadata_feature \
					(feature_id, table_name, parent_id, num_feature_range, information, frontend_name) \
					VALUES \
					(DEFAULT, $(tableName), \
					null, \
					$(numFeatureRange), \
					$(information), \
					$(frontendName));'

// newMetadataSubfeature: SQL for inserting one row to
// the metadata_feature table, representing a subfeature (which has a parent)

var newMetadataSubfeature =
				'INSERT INTO metadata_feature \
					(feature_id, table_name, parent_id, num_feature_range, information, frontend_name) \
					VALUES \
					(DEFAULT, $(tableName), \
					(SELECT feature_id FROM metadata_feature WHERE table_name = $(parentTableName)), \
					$(numFeatureRange), \
					$(information), \
					$(frontendName));'

// select[X]ID: SQL to get ID corresponding to non-null name

var selectFeatureID = '(SELECT feature_id from metadata_feature WHERE table_name = $(featureName:value))'
var selectSelectorID = '(SELECT selector_id from metadata_selector WHERE selector_name = $(selectorName:value))'
var selectSqlTypeID = '(SELECT type_id from metadata_sql_type WHERE type_name = $(sqlDatatype:value))'
var selectRefTypeID = '(SELECT type_id from metadata_reference_type WHERE type_name = $(referenceDatatype:value))'
var selectFrontendTypeID = '(SELECT type_id from metadata_frontend_type WHERE type_name = $(frontendDatatype:value))'

var initialSelectStatment = {
    newSelectFeatureID: 'SELECT feature_id, table_name from metadata_feature',
    newSelectSelectorID: 'SELECT selector_id, selector_name from metadata_selector',
    newSelectSqlTypeID: 'SELECT type_id, type_name from metadata_sql_type',
    newSelectRefTypeID: 'SELECT type_id, type_name from metadata_reference_type',
    newSelectFrontendTypeID: 'SELECT type_id, type_name from metadata_frontend_type'
}

// newMetadataColumn: SQL for inserting one row to the metadata_column
// table, representing a feature-associated or global data column

var newMetadataColumn =
'INSERT INTO metadata_column \
(column_id, feature_id, rootfeature_id, frontend_name, column_name, table_name, reference_column_name, reference_table_name, information, filter_selector, input_selector, sql_type, reference_type, frontend_type, is_nullable, is_default, is_global, is_ground_truth) \
VALUES \
(DEFAULT, \
(SELECT feature_id from metadata_feature WHERE table_name = $(featureName)), \
(SELECT feature_id from metadata_feature WHERE table_name = $(rootFeatureName)), \
$(frontendName), \
$(columnName), \
$(tableName), \
$(referenceColumnName:json), \
$(referenceTableName:json), \
$(information), \
(SELECT selector_id from metadata_selector WHERE selector_name = $(filterSelectorName)), \
(SELECT selector_id from metadata_selector WHERE selector_name = $(inputSelectorName)), \
(SELECT type_id from metadata_sql_type WHERE type_name = $(sqlDatatype)), \
(SELECT type_id from metadata_reference_type WHERE type_name = $(referenceDatatype)), \
(SELECT type_id from metadata_frontend_type WHERE type_name = $(frontendDatatype)), \
$(nullable), $(default), $(global), $(groundTruthLocation))'







module.exports = {
    subfeatureJoin,
    rootFeatureJoin,
    select,
    where,
    whereCondition,
    referenceSelectionJoin,
    submission,
    sorta,
    sortd,
    limit,
    offset
}; //this will export everything to the query engine 