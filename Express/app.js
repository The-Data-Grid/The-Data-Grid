const express = require('express');
const {Client} = require('pg');
const toiletResponse = require('./toiletResponse.js');
const app = express();
const port = 4001;


app.get('/toiletJSON', (req, res) => res.send(toiletResponse));
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'tdg_db',
    password: null,
    port: 5432,
  })
client.connect()


client
  .query('SELECT name FROM mtcars WHERE mpg < 17;')
  .then(res => console.log(res.rows))
  .catch(e => console.error(e.stack))


app.listen(port, () => console.log(`Express server running on port ${port}`));
