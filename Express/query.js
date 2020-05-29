////// SETUP //////
const pgp = require('pg-promise')();
const dotenv = require('dotenv');
dotenv.config();

const {select, where, commonJoin, urinalJoin, toiletJoin, sinkJoin, mirrorJoin, tableNames} = require('./statement.js');
const validate = require('./validate.js');

const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tdg_db',
    user: 'postgres',
    password: null,
    max: 30 // use up to 30 connections
};

const db = pgp(cn); //db.function is used for pg-promise queries


/***********************************
*** Column to Table Relationships **
***********************************/

const allTables = {
    toilet: {...commonJoin, ...toiletJoin},
    urinal: {...commonJoin, ...urinalJoin},
    sink: {...commonJoin, ...sinkJoin},
    mirror: {...commonJoin, ...mirrorJoin},
    room: commonJoin
};

const allTableNames = {
    toilet: Object.keys(commonJoin).concat(Object.keys(toiletJoin)),
    urinal: Object.keys(commonJoin).concat(Object.keys(urinalJoin)),
    sink: Object.keys(commonJoin).concat(Object.keys(sinkJoin)),
    mirror: Object.keys(commonJoin).concat(Object.keys(mirrorJoin)),
    room: Object.keys(commonJoin)
};

let validateFeatures = Object.keys(validate);

function validation(feature, columns, filters, res) {
    if(!validateFeatures.includes(feature)) {
        res.status(400).json({'Bad Request': `${feature} is not a valid feature`});
    };
    for(let column of columns) {
        if(!validate[feature]['column'].includes(column)) {
            res.status(400).json({'Bad Request': `${column} is not a valid column for the ${feature} feature`});
        };
    };
    for(let filter of filters) {
        if(!validate[feature]['filter'].includes(filter)) {
            res.status(400).json({'Bad Request': `${filter} is not a valid filter for the ${feature} feature`});
        };
    };
}


async function initialSetup() {
    const setup = await db.many("select c.column_name, t.table_name from information_schema.tables as t inner join information_schema.columns as c on t.table_name = c.table_name where t.table_schema = 'public' and t.table_type = 'BASE TABLE'");
    validLookup = {};
    for(feature of validateFeatures) {
        validLookup[feature] = setup.filter(pair => allTableNames[feature].includes(pair.table_name)) //this is crazy
    }
}

initialSetup();

function columnLookup(feature, columns, res) {
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

    //// Validation
    validation(res.locals.parsed.features, res.locals.parsed.columns, Object.keys(res.locals.parsed.filters), res)

    //// Formatting the data
    let data = {};    // values object for SELECT and JOINS
    let query = [];    // array of clauses that make up the query
    data.feature = 'audit_' + res.locals.parsed.features;
    let allJoins = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))]; //array of unique columns from returned columns and filters
    let columnToTable = columnLookup(res.locals.parsed.features, allJoins, res);  // each column has a unique table
    let columnAndTable = columnTableFormat(columnToTable, res.locals.parsed.features);  // table.column syntax for SELECT and WHERE

    //// SELECT Clause
    data.returnColumns = res.locals.parsed.columns.map(element => {return columnAndTable[element]}).join(', ') // transforms each column to table.column
    query.push(pgp.as.format(select.query, data));

    //// JOIN Clauses
    let tables = [...new Set(allJoins.map(element => {return columnToTable[element]}))]; // get list of unique needed tables
    tables = tables.filter(table => table != null);
    for(let table of tables) {  // adding dependent joins  
        allTables[res.locals.parsed.features][table].dependencies.forEach(dependency => {tables.push(dependency)});
    };
    tables = [...new Set(tables)]; // removing duplicates again

    //**** Sorting table order by number of dependencies length ****/
    sortTables = {}
    for(let table of tables) {
        sortTables[table] = allTables[res.locals.parsed.features][table].dependencies.length;
    };
    let tableEntries = Object.keys(sortTables).sort((a,b) => sortTables[a] - sortTables[b])

    //**** Pushing each join to the query in order ****/
    for(let table of tableEntries) {  
        query.push(pgp.as.format(allTables[res.locals.parsed.features][table].query, data))  
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

    // Performing the query
    let finalQuery = query.join(' ') + ';';  //Everything has been formatted in place so now we just concatenate
        
    db.any(finalQuery)  //Finally querying the database
        .then(data => {
            console.log(data)
            res.json(data);
        }).catch(err => {
            console.log(err)
        });
};



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

