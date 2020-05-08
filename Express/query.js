const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: 'localhost',
    database: 'tdg_db',
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

// SELECT name FROM mtcars WHERE mpg < 17
const lowmpg = (req, res) => {
    pool.query('SELECT name FROM mtcars WHERE mpg < 17;', (error, results) => {
        if (error){
            throw error
        }
        res.status(200).json(results.rows)
    })
}

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

let auditQuery = (filters, path, sql, res) => {
    // do some stuff
};

module.exports = {
    lowmpg,
    featureQuery,
    auditQuery,
}
