// SETUP //
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const parse = require('./parse.js');
const query = require('./query.js');
const cors = require('cors');
const port = process.env.PORT || 4001;
// END OF SETUP //

app.use(cors());

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
app.set('json spaces', 3);   //to prettify the response json


app.get('/api/a/:feature/:include', parse.featureParse, query.featureQuery); 
app.get('/api/a/:include', cors());
//app.get('/api/s/filter', cors(), query.setupQuery(req, res));

app.listen(port, () => console.log(`Express server running on port ${port}`));
