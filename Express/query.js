////// SETUP //////
const pgp = require('pg-promise')();
const dotenv = require('dotenv');
dotenv.config();

const {select, where, join} = require('./statement.js');

const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tdg_db',
    user: 'postgres',
    password: null,
    max: 30 // use up to 30 connections
};

const db = pgp(cn); //db.function is used for pg-promise queries

console.log("Setting up Column to Table relationships");

// Selecting all database columns and tables
db.many("select c.column_name, t.table_name from information_schema.tables as t inner join information_schema.columns as c on t.table_name = c.table_name where t.table_schema = 'public' and t.table_type = 'BASE TABLE'")
    .then(data => {
        const columnToTable = {};
        for(pair of data) { 
            columnToTable[pair.column_name] = pair.table_name
        }
        //console.log(columnToTable)
    })
    .catch(err => {
        console.log(err)
    });



console.log("Finished setting up Column to Table relationships");
////// END OF SETUP //////


////// QUERY ENGINE //////
function featureQuery(req, res) {  
    // Formatting the data
    let data = {};    // values object for SELECT and JOINS
    let query = [];    // array of clauses that make up the query
    data.feature = 'audit_' + res.locals.parsed.features;
    let allJoins = [...new Set(Object.values(res.locals.parsed.columns).concat(Object.keys(res.locals.parsed.filters)))]; //array of unique columns from returned columns and filters
    let columnToTable = columnToTable(data.feature, allJoins);  // each column has a unique table
    let columnAndTable = columnAndTable(data.feature, allJoins);  // table.column syntax for SELECT and WHERE

    // SELECT Clause
    data.returnColumns = res.locals.parsed.columns.map(element => {return columnAndTable[element]}) // transforms each column to table.column
    select.values = data;
    query.push(select);

    // JOIN Clauses
    let tables = [...new Set(allJoins.map(element => {return columnToTable[element]}))]; // get list of unique needed tables
    for(let table of tables) {  // adding dependent joins
        join[table].dependencies.forEach(dependency => {tables.push(dependency)});
    };
    tables = [...new Set(tables)]; // removing duplicates again

    sortTables = {} // getting sorted list of tables
    for(let table of tables) {
        sortTables[table] = join[table].dependencies.length;
    };
    let tableEntries = Object.entries(sortTables);
    tableEntries = tableEntries.sort((a,b) => {a[1] - b[1]}).map(element => {return element[0]}); 

    for(let table of tableEntries) {  // pushing each join to the query in order
        let joinClause = {};
        joinClause.query = join[table].query;
        joinClause.values = data
        query.push(join[table])  
    };
    
    // WHERE Clauses
    let initialWHERE = true;
    for(let filter in res.locals.parsed.filters) {
        if(initialWHERE == true) {          // The first clause must be WHERE and the following clauses must be AND
            filter.clause = 'WHERE';
            initalWHERE = false;
        } else {
            filter.clause = 'AND'
        }
        filter.filterColumns = data.columnAndTable[filter]; //getting the correct table.column string
        where.values = filter; // adding the data object to where
        query.push(where);
    }

    // Performing the query
    let finalQuery = pgp.helpers.concat(query)
}



let setupQuery = (req, res) => {
    res.json(app.locals.setup);
};

let auditQuery = (filters, path, sql, res) => {
    // do some stuff
};


module.exports = {
    featureQuery,
    auditQuery,
    setupQuery,
};

