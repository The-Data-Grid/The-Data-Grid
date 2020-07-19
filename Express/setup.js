// Setup.js //

// We need to query the metadata tables at the beginning of each session to get data for the setup object,
// querying, upload, and more. Everything that queries the metadata tables to recieve this information
// should go here and then the other files can import the information

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

SELECT list.data_elementname FROM list INNER JOIN list_m2m ON list_m2m.list_id = list.list_id
INNER JOIN subfeature ON subfeature.observation_id = list_m2m.observation_id;

/*************
* Approach 2 *
**************/
var metadata_table;
var metadata_col;
var metadata_datatype;
var metadata_selector;

// How do we connect different metadata_tables? Still a little confused on how the metadata stuff works.
SELECT metadata_col.information FROM metadata_col INNER JOIN metadata_table ON metadata_col.table_id = metadata_table.table_id;

/////////////////////////////////
// Generate table join clauses //
/////////////////////////////////

// Serves functionality of statement.js. We can use the format from statement.js
// of ```tablename: {query: 'INNER JOIN...', dependencies: [] }```