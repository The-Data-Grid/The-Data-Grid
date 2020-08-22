// Setup.js //


///////////////////////////
// Common metadata query //
///////////////////////////
// We need to query the metadata tables at the beginning of each session to get data for the setup object,
// querying, upload, and more. Everything that queries the metadata tables to recieve this information
// should go here and then the other files can import the information

// SETUP //
const pgp = require("pg-promise")();
const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tdg_db_new',
    user: 'postgres',
    password: null,
    max: 5 // use up to 5 connections
};

 //db.function is used for pg-promise queries
const db = pgp(cn);

// Making metadata JS objects
async function metadataSetup() {
    // Select all column ids, column names and their respective table names
    var idColumnTableLookup = await db.any('SELECT col.column_id, col.backend_name, tab.backend_name, tab.feature \
                                        FROM metadata_column AS col \
                                        INNER JOIN metadata_table AS tab ON col.table_id = tab.table_id');

    // Select all tables and their parents. If no parent then return NULL for parent.
    var tableParents = await db.any('SELECT child.backend_name, parent.backend_name FROM metadata_table AS child \
                                     LEFT JOIN metadata_table AS parent ON child.parent_id = parent.parent_id');

    // Closing the connection !Important!
    db.$pool.end();

    module.exports = {
        idColumnTableLookup,
        tableParents
    };

    
    /*
    to get table names from ids: (this will throw error if the id is not validated)
    idInput = [1,4,23,9] //example
    idInput.map(number => idColumnTableLookup[String(number)].table) 

    construct table.column SQL syntax from ids:
    idInput = [1,4,23,9] //example
    idInput.map(number => idColumnTableLookup[String(number)]).map(object => `${object.table}.${object.column}`)
     */
};

// Calling the metadata setup function
metadataSetup();

////////////////////////////////////////////////////////////
// Query column to database table lookup table generation //
////////////////////////////////////////////////////////////

// Serves the functionality of tableLookup and setupTableLookup

// Select and Where clauses //
const select = {
    query: 'SELECT $(returnColumns:raw) FROM $(feature:name)'
};

const where = { // ex: {clause: 'AND', filter: "item_sop.sop_name", operation: "=", value: "Example SOP #1"}
    query: '$(clause:value) $(filterColumns:value) $(operation:value) $(value)' 
};

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

/*


*/

async function metadataQuery() {

    let returnableIDArray = []
    let idColumnTableLookup = {};


    // Query all metadata
    let rawQuery = await db.any('SELECT f.table_name, f.num_feature_range, f.information, \
                                        f.frontend_name, rf.table_name, c.column_id, c.frontend_name, c.column_name \
                                        c.table_name, c.reference_column_name, c.reference_table_name \
                                        c.information, c.is_nullable, c.is_default, c.is_global, \
                                        c.is_ground_truth, fs.selector_name, is.selector_name, \
                                        sql.type_name, rt.type_name, ft.type_name, ft.type_description \
                                        FROM metadata_column as c \
                                        INNER JOIN metadata_feature AS f ON c.feature_id = f.feature_id \
                                        INNER JOIN metadata_feature AS rf ON c.rootfeature_id = rf.feature_id \
                                        LEFT JOIN metadata_selector AS fs ON c.filter_selector = fs.selector_id \
                                        LEFT JOIN metadata_selector AS is ON c.input_selector = is.selector_id \
                                        LEFT JOIN metadata_sql_type AS sql ON c.sql_type = sql.type_id \
                                        LEFT JOIN metadata_reference_type AS rt ON c.reference_type = rt.type_id \
                                        LEFT JOIN metadata_frontend_type AS ft ON c.frontend_type = ft.type_id');

    // Construct idColumnTableLookup                                  
    for(let row in rawQuery) {

        let id = row['c.column_id'].toString();
        if(row['fs.selector_name'] === null) {
            let filterable = false
        } else {
            let filterable = true
        }

        idColumnTableLookup[id] = {
            column: row['c.column_name'],
            table: row['c.table_name'],
            rootfeature: row['rf.table_name'],
            feature: row['f.table_name'],
            referenceColumn: row['c.reference_column_name'],
            referenceTable: row['c.reference_table_name'],
            filterable: filterable,
            sqlType: row['sql.type_name'],
            groundTruthLocation: row['c.is_ground_truth']
        }
    }


    // for record in metadata
        //if special type
            //custom sql


    returnableIDArray.push(new returnableID())
}



class returnableID {
    constructor(columnTree, tableTree, returnType, customSQL) {
        this.columnTree = columnTree,
        this.tableTree = tableTree,
        this.returnType = returnType,
        this.customSQL = customSQL,

        this.joinList = this.makeJoinList(this.columnTree, this.tableTree)
    }

    makeJoinList(columnTree, tableTree) {
        let joinList = [];
        for(let n = 0; n < tableTree.length - 1; n++) {
            joinList.push({
                joinTable: tableTree[n+1],
                joinColumn: columnTree[n+1],
                originalTable: tableTree[n],
                originalColumn: columnTree[n]
            });
        }

        return joinList
    }
}