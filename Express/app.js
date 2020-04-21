const express = require('express');
const db = require('./query.js');
const toiletResponse = require('./toiletResponse.js');
const app = express();
const port = 4001;


app.get('/toilet', db.toilet); 


app.listen(port, () => console.log(`Express server running on port ${port}`));
