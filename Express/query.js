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

module.exports = {
    lowmpg,
}