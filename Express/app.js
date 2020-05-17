const express = require('express');
const parse = require('./parse.js');
const query = require('./query.js');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 4001;

//`npm run dev` runs a nodemon server for development
//`node ~/app.js` runs a node server

app.get('/api/f/:feature/:include', cors(), parse.featureParse); 
app.get('/api/a/:include', cors());
app.get('/api/s/filter', cors(), query.setupQuery(req, res));

app.listen(port, () => console.log(`Express server running on port ${port}`));
