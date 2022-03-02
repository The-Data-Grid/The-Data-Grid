// Postgres connection, query execution, query formatting
const pgp = require('pg-promise')();
require('dotenv').config();
const isDeployment = ['-d', '--deploy'].includes(process.argv[2]);
console.log(isDeployment ? 'DEPLOYMENT' : 'DEVELOPMENT');

// PostgreSQL -> Javascript type parsing
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 
pgp.pg.types.setTypeParser(1184, require('../parse.js').timestamptzParse) //Parsing the TIMESTAMPTZ SQL type as a JS Date

var tdgdbname = isDeployment ? process.env.PGDATABASE : 'v5';
var tdgdbuser = 'postgres';
var tdgpassword = isDeployment ? process.env.PGPASSWORD : null;
var tdghost = isDeployment ? process.env.PGHOST : 'localhost';
console.log('PostgreSQL Host: ' + tdghost);

const postgresClient = {
    format: pgp.as.format
};

function connectPostgreSQL(config) {
    if(config == 'default') {

        console.log(`Establishing PostgreSQL connections...`)

        // Default runtime database connection
        const defaultConnection = { //connection info
            host: tdghost,
            port: 5432,
            database: tdgdbname,
            user: tdgdbuser,
            password: tdgpassword,
            max: 30 // use up to 30 connections
        };
        const db = pgp(defaultConnection);
        console.log(`New PostgreSQL Connection: default`)

        postgresClient.getConnection = {
            db
        };
    } else if(config == 'construct') {

        console.log(`Establishing PostgreSQL connections...`)

        // Schema construction CLI database connection
        const constructionConnection = { 
            host: tdghost,
            port: 5432,
            database: tdgdbname,
            user: tdgdbuser,
            password: tdgpassword,
            max: 1, // use only one connection
            idleTimeoutMillis: 1 // disconnect right after
        };
        const cdb = pgp(constructionConnection);
        console.log(`New PostgreSQL Connection: construct`)

        postgresClient.getConnection = {
            cdb
        };
    } else Error('Must use a valid connection type: \'default\', \'construct\'')
};

module.exports = {
    postgresClient,
    connectPostgreSQL
};