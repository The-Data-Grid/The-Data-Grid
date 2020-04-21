const {Pool} = require('pg');
const toilet = require('./toiletResponse')
let n_queries = 0; //logging
let n_errors = 0; //logging
const pool = new Pool({ //PostgreSQL Connection
  user: 'postgres', //Server user
  host: 'localhost',
  database: 'tdg_db', 
  password: null, //choose the password of the user you are connecting as
  port: 5432 //default postgreSQL port
});

const firstResponse = (req, res) => {

    pool.query('SELECT drat FROM mtcars;')
    .then(result => {
        n_queries ++;
        res.json(toilet.impute(toilet.toiletResponse.toilets, result.rows));
    })
    .catch(err => {
        console.log(err);
        n_errors ++;
    })
};

module.exports = {
    firstResponse
};

