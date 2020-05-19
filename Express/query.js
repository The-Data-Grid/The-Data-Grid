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
        console.log(data)
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

function featureQuery(req, res) {
    let data = {};
    data.feature = 'audit_' + res.locals.parsed.features;
}

//
/*
let statementArray = [];
let columnArray = [];
for(let obj in sql)  {
    for(let column in obj.columns) {
        statementArray.push(column);
        Object.name(obj)
    }
}
*/

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

