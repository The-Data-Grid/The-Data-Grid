////// SETUP //////
const pgp = require('pg-promise');
const {sql} = require('./statement.js');
const {setup} = require('.statement.js');

const dotenv = require('dotenv');
dotenv.config();

const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tgd_db',
    user: process.env.POSTGRES_USER,
    password: null,
    max: 30 // use up to 30 connections
};

const db = pgp(cn); //db.function is used for pg-promise queries

////// END OF SETUP //////

// SELECT name FROM mtcars WHERE mpg < 17

let featureQuery = (filters, path, sql, res) => {
    pool.query('something')
    .then(result => {
        res.json(result)
    })
    .catch(error => {
        console.log(error);
        throw error;
    })
}

//
let statementArray = [];
let columnArray = [];
for(let obj of sql)  {
    for(let column in obj.columns) {
        statementArray.push(column);
        Object.name(obj)
    }
}


let setupQuery = (req, res) => {
    res.json(app.locals.setup);
};

let auditQuery = (filters, path, sql, res) => {
    // do some stuff
};

module.exports = {
    lowmpg,
    featureQuery,
    auditQuery,
    setupQuery,
    db,
};

