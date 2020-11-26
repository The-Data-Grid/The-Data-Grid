// Postgres connection, query execution, query formatting
var pgp = require('pg-promise')();
// pg-native for native libpq C library bindings which we need for sync queries
const SyncClient = require('pg-native');

// PostgreSQL -> Javascript type parsing
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 
pgp.pg.types.setTypeParser(1184, require('../parse.js').timestamptzParse) //Parsing the TIMESTAMPTZ SQL type as a JS Date

var tdgdbname = 'v4';
var tdgdbuser = 'postgres';


// Setup database connection (single connection when server starts)
const syncdb = new SyncClient();
syncdb.connectSync(`host=localhost port=5432 dbname=${tdgdbname} connect_timeout=5 user=${tdgdbuser}`);
console.log(`Connected to database ${tdgdbname} as user ${tdgdbuser} for backend setup`)


// Default runtime database connection
const defaultConnection = { //connection info
    host: 'localhost',
    port: 5432,
    database: tdgdbname,
    user: tdgdbuser,
    password: null,
    max: 30 // use up to 30 connections
};
const db = pgp(defaultConnection);


module.exports = {
    db,
    syncdb,
    formatSQL: pgp.as.format
}