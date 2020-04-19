const {Pool} = require('pg');


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tdg_db',
  password: null,
  port: 5432,
});

const toilet = (req, res) => {
    pool.query('SELECT drat FROM mtcars;')
    .then(result => {
        res.json(result.rows);
    })
    .catch(err => {
        console.log(err);
    })
};

module.exports = {
    toilet
};

