const {sql} = require('./statement.js');
const {setup} = require('./statement.js');
const {Pool} = require('pg');
const pool = new Pool({ //PostgreSQL Connection
  user: 'postgres', //Server user
  host: 'localhost',
  database: 'tdg_db', 
  password: null, //choose the password of the user you are connecting as
  port: 5432 //default postgreSQL port
});

let featureQuery = (filters, path, sql, res) => {
    pool.query('something')
    .then(result => {
        res.json(result)
    })
    .catch(error => {
        console.log(error);
        throw error;
    })
};

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
    featureQuery,
    auditQuery,
    setupQuery
};

