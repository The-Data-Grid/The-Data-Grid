const dotenv = require('dotenv');
dotenv.config();

//const {select, where, commonJoin, urinalJoin, toiletJoin, sinkJoin, mirrorJoin} = require('./statement.js');
const validate = require('./validate.js');

// Database info
const pgp = require('pg-promise')();
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 

const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tdg_db_new',
    user: 'postgres',
    password: null,
    max: 30 // use up to 30 connections
};
const db = pgp(cn); //db.function is used for pg-promise PostgreSQL queries

////// SETUP //////

//** Testing request response cycle time (for dev only) **//
var cycleTime = [];

/*

//// Column to Table Relationships ////

//  All table join clauses for each feature to be filtered
const joinClauseTables = {
    toilet: {...commonJoin, ...toiletJoin},
    urinal: {...commonJoin, ...urinalJoin},
    sink: {...commonJoin, ...sinkJoin},
    mirror: {...commonJoin, ...mirrorJoin},
    room: commonJoin
};

// All table names for each feature to be filtered
const joinClauseTableNames = {
    toilet: Object.keys(commonJoin).concat(Object.keys(toiletJoin)),
    urinal: Object.keys(commonJoin).concat(Object.keys(urinalJoin)),
    sink: Object.keys(commonJoin).concat(Object.keys(sinkJoin)),
    mirror: Object.keys(commonJoin).concat(Object.keys(mirrorJoin)),
    room: Object.keys(commonJoin)
};

// Getting all Column to Table Relations for each feature request
async function tableLookupSetup() {
    const setup = await db.many("select c.column_name, t.table_name from information_schema.tables as t inner join information_schema.columns as c on t.table_name = c.table_name where t.table_schema = 'public' and t.table_type = 'BASE TABLE'");
    var validLookup = {};
    for(feature of validateFeatures) {
        validLookup[feature] = setup.filter(pair => joinClauseTableNames[feature].includes(pair.table_name)) //this is crazy
    }
}

tableLookupSetup();

// Getting tables of columns and filters in request
function tableLookup(feature, columns, res) {
    let out = {}
    for(let column of columns) {
        let match = validLookup[feature].filter(pair => pair.column_name == column);
        if(match.length == 1) {
            out[column] = match[0].table_name;
        } else if(match.length == 0) {
            out[column] = null;
        } else {
            console.log('Error code 101: One column matched to multiple tables. This shouldn\'t happen! Error is within query.js');
            res.status(500).json({'Server Error': 'Error code 101: One column matched to multiple tables. Please email admin@thedatagrid.org for help'});
        };
    };
    return out
};

// Formatting column to table relationships as 'table.column'
function columnTableFormat(lookup, feature) {
    let out = {}
    for(let column in lookup) {
        if(lookup[column] === null) {
            out[column] = 'audit_' + feature + '.' + column;
        } else {
            out[column] = lookup[column] + '.' + column;
        };
    };
    return out
};

////// END OF SETUP //////


////// QUERY ENGINE //////

function featureQuery(req, res) {  

    /*
    //// Formatting the data
    let data = {};    // values object for SELECT and JOINS
    let query = [];    // array of clauses that make up the query
    data.feature = 'audit_' + res.locals.parsed.features;
    let allJoins = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))]; //array of unique columns from returned columns and filters
    let columnToTable = tableLookup(res.locals.parsed.features, allJoins, res);  // each column has a unique table
    let columnAndTable = columnTableFormat(columnToTable, res.locals.parsed.features);  // table.column syntax for SELECT and WHERE

    //// SELECT Clause
    data.returnColumns = res.locals.parsed.columns.map(element => {return columnAndTable[element]}).join(', ') // transforms each column to table.column
    query.push(pgp.as.format(select.query, data));

    //// JOIN Clauses
    let tables = [...new Set(allJoins.map(element => {return columnToTable[element]}))]; // get list of unique needed tables
    tables = tables.filter(table => table != null);
    for(let table of tables) {  // adding dependent joins  
        joinClauseTables[res.locals.parsed.features][table].dependencies.forEach(dependency => {tables.push(dependency)});
    };
    tables = [...new Set(tables)]; // removing duplicates again

    // Sorting table order by number of dependencies length 
    // Note: By getting the tables we could calculate the hiearchy and get order from that
    sortTables = {}
    for(let table of tables) {
        sortTables[table] = joinClauseTables[res.locals.parsed.features][table].dependencies.length;
    };
    let tableEntries = Object.keys(sortTables).sort((a,b) => sortTables[a] - sortTables[b])

    // Pushing each join to the query in order 
    for(let table of tableEntries) {  
        query.push(pgp.as.format(joinClauseTables[res.locals.parsed.features][table].query, data))  
    }; 

    //// WHERE Clauses
    let initialWHERE = true;
    for(let filter in res.locals.parsed.filters) {
        let out = {}
        if(initialWHERE == true) {          // The first clause must be WHERE and the following clauses must be AND
            out.clause = 'WHERE';
            initialWHERE = false;
        } else {
            out.clause = 'AND'
        }
        out.filterColumns = columnAndTable[filter]; //getting the correct table.column string
        out.value = res.locals.parsed.filters[filter].value
        out.operation = res.locals.parsed.filters[filter].operation
        query.push(pgp.as.format(where.query, out));
    }
    */

    /*

    let data = {};    // values object for SELECT and JOINS
    let query = [];    // array of clauses that make up the query
    data.feature = 'feature_' + res.locals.parsed.features;
    let IDs = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))]; //array of unique columns from returned columns and filters

    // Getting returnableID class from ID
    IDs = IDs.map((id) => setup.returnableIDLookup[id.toString()])

    let submissionIDs = IDs.filter((id) => id.returnType == 'submission');

    let standardIDs = IDs.filter((id) => id.returnType == 'local' || 'item' || 'location');

    let listIDs = IDs.filter((id) => id.returnType == 'list');

    if(submissionIDs.length + standardIDs.length + listIDs.length != IDs.length) {
        // res.status(500).send('AAAAAA fuck')
    }

    // Submission JOINs

    let refSelection = [];
    submissionIDs.forEach((submission, index) => {
        refSelection.push(submission)
    })

    */

    /*
    for IDs where type = submission
        id42, id31, id7 -> abc, abd, ace
            -> a[b[cd]ce]
                -> joined to submission
    
    for IDs where type = special (obs count)
        id12, id4-> a, b
            -> joined to 
    

    // Concatenating clauses to make final SQL query
    let finalQuery = query.join(' ') + ';'; 

     // DEBUG: Show SQL Query //
     console.log(finalQuery); 
    
    // Testing request response cycle time (for dev only) //
    cycleTime.push(Date.now())
    console.log('query.js query - ' + cycleTime[1] - cycleTime[0], ' ms');

    // Finally querying the database
    db.any(finalQuery)  
        .then(data => {

            // DEBUG: Show response object //
            console.log(data); 

            //  Testing request response cycle time (for dev only) //
            cycleTime.push(Date.now())
            console.log('query.js response - ' + cycleTime[2] - cycleTime[0], 'ms');
            cycleTime = []
            

            return res.json(data);

        }).catch(err => {

            // add internal error code
            return res.status(500).send('<some error>');

            console.log(err)
        });
};

*/

let setupQuery = (req, res) => {
    res.json(app.locals.setup);
};

let auditQuery = (filters, path, sql, res) => {
    // do some stuff
};
 
let featureQuery = (req, res) => {
    // get all ids
    //array of unique IDs from returned columns and filters
    let allIDs = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))];
    /* join them and record aliases 
    submission
        in: joinList
        out: BOOL
    list
        in: joinSQL, selectSQL
        out: auditing dependency
    special
        in: joinSQL, selectSQL
        out: auditing dependency
    local, item, location
        in: joinList, data column
        out: auditing dependency
    feature tree
        in: auditing dependencies
        out: auditing joins and aliases
    */
    // use aliases to input SELECTs
    // use aliases to input WHEREs
    // concat SQL and query db
    // construct tableObject from results 
}











module.exports = {
    featureQuery,
    auditQuery,
    setupQuery,
    cycleTime
};

