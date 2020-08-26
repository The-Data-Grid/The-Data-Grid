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
    database: 'meta',
    user: 'postgres',
    password: null,
    max: 5 // use up to 5 connections
};

 //db.function is used for pg-promise queries
const db = pgp(cn);


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

class returnableID {
    constructor(columnTree, tableTree, returnType, joinSQL, selectSQL) {
        this.columnTree = columnTree,
        this.tableTree = tableTree,
        this.returnType = returnType,
        this.joinSQL = joinSQL,
        this.selectSQL = selectSQL

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

async function setupQuery() {

    let returnableIDLookup = {};
    let idColumnTableLookup = {};
    let tableParents = {};
    let setupObject = {};

    // Query all metadata
    let rawQuery = await db.any('SELECT f.table_name as f__table_name, f.num_feature_range as f__num_feature_range, f.information as f__information, \
                                        f.frontend_name as f__frontend_name, rf.table_name as rf__table_name, c.column_id as c__column_id, c.frontend_name as c__frontend_name, c.column_name as c__column_name, \
                                        c.table_name as c__table_name, c.reference_column_name as c__reference_column_name, c.reference_table_name as c__reference_table_name, \
                                        c.information as c__information, c.is_nullable as c__is_nullable, c.is_default as c__is_default, c.is_global as c__is_global, \
                                        c.is_ground_truth as c__is_ground_truth, fs.selector_name as fs__selector_name, ins.selector_name as ins__selector_name, \
                                        sql.type_name as sql__type_name, rt.type_name as rt__type_name, ft.type_name as ft__type_name, ft.type_description as ft__type_description \
                                        FROM metadata_column as c \
                                        LEFT JOIN metadata_feature AS f ON c.feature_id = f.feature_id \
                                        LEFT JOIN metadata_feature AS rf ON c.rootfeature_id = rf.feature_id \
                                        LEFT JOIN metadata_selector AS fs ON c.filter_selector = fs.selector_id \
                                        LEFT JOIN metadata_selector AS ins ON c.input_selector = ins.selector_id \
                                        LEFT JOIN metadata_sql_type AS sql ON c.sql_type = sql.type_id \
                                        LEFT JOIN metadata_reference_type AS rt ON c.reference_type = rt.type_id \
                                        LEFT JOIN metadata_frontend_type AS ft ON c.frontend_type = ft.type_id');



    // Get frontend types                             
    let frontendTypes = await db.any('SELECT type_name FROM metadata_frontend_type');
    frontendTypes = frontendTypes.map((el) => el.type_name)

    // Get features
    let allFeatures = await db.any('SELECT f.table_name as f__table_name, f.num_feature_range as f__num_feature_range, f.information as f__information,  \
                                    f.frontend_name as f__frontend_name, ff.table_name as ff__table_name\
                                    FROM metadata_feature AS f \
                                    LEFT JOIN metadata_feature as ff ON f.parent_id = ff.feature_id');

    // Order so features come before subfeatures
    allFeatures = [...allFeatures.filter((feature) => feature['ff__table_name'] === null), ...allFeatures.filter((feature) => feature['ff__table_name'] !== null)]
         
    console.log(allFeatures)
    // Construct tableParents
    allFeatures.map((el) => [el['f__table_name'], el['ff__table_name']]).forEach((el) => {
        tableParents[el[0]] = el[1]
    });

    // Construct setup object //
    // ============================================================

    setupObject = {};

    //construct columnObjects
    let columnObjects = rawQuery.map((row) => {

        let fSelector = (row['fs__selector_name'] === null ? null : {selectorKey: row['fs__selector_name'], selectorValue: 'SQL HERE!'})
        
        let iSelector = (row['ins__selector_name'] === null ? null : {selectorKey: row['ins__selector_name'], selectorValue: 'SQL HERE!'})

        let datatype = frontendTypes.indexOf(row['ft__type_name'])
        
        return(
            [row['c__is_global'], {
                default: row['c__is_default'],
                columnFrontendName: row['c__frontend_name'],
                columnBackendID: row['c__column_id'],
                filterSelector: fSelector,
                inputSelector: iSelector,
                datatype: datatype,
                nullable: row['c__is_nullable'],
                information: row['c__information']
            }, row['f__table_name']]
        );
    });

    // Construct featureTreeObject
    let rootFeatures = allFeatures.map((el) => [el['f__table_name'], el['ff__table_name']]).filter((el) => el[1] === null).map((el) => el[0])

    console.log(rootFeatures)

    let featureTreeHelper = {};

    let featureOrder = allFeatures.map((feature) => feature['f__table_name'])

    console.log(featureOrder)

    rootFeatures.forEach((el) => {
        featureTreeHelper[el] = [];
    })

    allFeatures.map((el) => [el['f__table_name'], el['ff__table_name']]).forEach((el) => {
        if(el[1] !== null) {
            featureTreeHelper[el[1]].push(el[0])
        }
    })
    
    console.log(featureTreeHelper)

    let featureColumns = allFeatures.map((el) => {
        let frontendName = el['f__frontend_name']
        let information = el['f__information']
        let numFeatureRange = el['f__num_feature_range'] 

        let dataColumns = columnObjects.filter((row) => row[2] == el['f__table_name']).map((row) => row[1]);

        // get array of children
        let directChildren = (el['ff__table_name'] === null ? featureTreeHelper[el['f__table_name']] : [])
        // get indicies
        directChildren = directChildren.map((child) => featureOrder.indexOf(child))


        return({
            frontendName: frontendName,
            information: information,
            numFeatureRange: numFeatureRange,
            dataColumns: dataColumns,
            directChildren: directChildren
        })
    })

    setupObject.subfeatureStartIndex = allFeatures.map((feature) => (feature['ff__table_name'] === null ? false : true)).indexOf(true);
    setupObject.globalColumns = columnObjects.filter((row) => row[0] === true).map((row) => row[1]);
    setupObject.datatypes = frontendTypes;
    setupObject.featureColumns = featureColumns;

    // ============================================================

    // Construct idColumnTableLookup                                  
    for(let row of rawQuery) {

        let id = row['c__column_id'].toString();

        let filterable = (row['fs__selector_name'] === null ? false : true)

        idColumnTableLookup[id] = {
            column: row['c__column_name'],
            table: row['c__table_name'],
            rootfeature: row['rf__table_name'],
            feature: row['f__table_name'],
            referenceColumn: row['c__reference_column_name'],
            referenceTable: row['c__reference_table_name'],
            filterable: filterable,
            sqlType: row['sql__type_name'],
            groundTruthLocation: row['c__is_ground_truth']
        }
    }

    // Construct returnableIDs
    for(let row of rawQuery) {

        let id = row['c__column_id'].toString();

        // Writing custom SQL for custom queries
        if(row['rt__type_name'] == 'special') {
            // Auditor Name coalesce
            if(row['c__frontend_name'] == 'Auditor Name') {

                let joinSQL = 'LEFT JOIN tdg_auditor_m2m ON \
                                tdg_observation_count.observation_count_id = tdg_auditor_m2m.observation_count_id \
                                INNER JOIN tdg_users ON tdg_auditor_m2m.user_id = tdg_users.user_id';

                let selectSQL = "COALESCE($(feature.raw).data_auditor, concat_ws(' ', tdg_users.data_first_name, tdg_users.data_last_name)";

                returnableIDLookup[id] = (new returnableID())

            } else if(row['c__frontend_name'] == 'Standard Operating Procedure') { // SOP



            } else {
                console.log('Construction Error 3001: Unknown special global returnable ID specified in schema')
                console.log('Construction aborted!')
                return
            }
        }
    }

    // for record in metadata
        //if special type
            //custom sql


    //returnableIDArray.push(new returnableID())

    function sendSetup(req, res) {

        var serverLastModified = Date.now() // for now
    
        console.log(`Sent setup at ${Date.now()}`)

        // Check last modified
        // if(res.locals.parsed['lastModified'] < serverLastModified) { // setup is new
        if(true) {
    
            setupObject['setupLastModified'] = serverLastModified
            return res.status(200).json(setupObject) //send object
            
        } else {
    
            setupObject['setupLastModified'] = serverLastModified
            return res.status(304).json(setupObject) //send object - not modified
    
        }
    }

    return({
        returnableIDLookup: returnableIDLookup,
        idColumnTableLookup: idColumnTableLookup,
        tableParents: tableParents,
        sendSetup: sendSetup
    })
}

module.exports = setupQuery()




