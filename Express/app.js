const express = require('express');
const query = require('./query.js');
const app = express();
const port = 4001;

//`npm run dev` runs a nodemon server for development
//`node ~/app.js` runs a node server

app.get('/toilet', query.firstResponse); 

app.listen(port, () => console.log(`Express server running on port ${port}`));
