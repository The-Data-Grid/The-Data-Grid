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

let auditQuery = (filters, path, sql, res) => {
    // do some stuff
};

module.exports = {
    featureQuery,
    auditQuery
};

