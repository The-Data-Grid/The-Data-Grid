const express = require('express');
// const {Client} = require('pg');
const toiletResponse = require('./toiletResponse.js');
const bodyParser = require('body-parser');
const db = require('./query.js');
const parse = require('./parse.js');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4001;

//Get all toilet objects from the JSON
app.get('/getObject', (req, res) => res.send(toiletResponse));

//get the nth element in the JSON, where n = id
app.get('/getObject/:id', (req, res) => {
  let i = 0;
  let found = false;

  if (req.params.id < Object.keys(toiletResponse["toilets"]).length){ //check if id is less than the num of elements present
    toiletResponse["toilets"].forEach(element => {
      if (i == parseInt(req.params.id)){
        res.json(element);
      }
      i += 1;
      found = true
    });
  }
  else { //if overbound
    res.status(400).json({msg: `Element indexing out of bounds! Max element index = ${Object.keys(toiletResponse["toilets"]).length - 1}`})
  }
});

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/cars/lowmpg', db.lowmpg);

app.get('/api/f/:feature/:include', cors(), parse.featureParse); 
app.get('/api/a/:include', cors());

app.listen(port, () => console.log(`Express server running on port ${port}`));
