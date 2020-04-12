const express = require('express');
const toiletResponse = require('./toiletResponse.js');
const app = express();
const port = 4001;


app.get('/toiletJSON', (req, res) => res.send(toiletResponse));


app.listen(port, () => console.log(`Express server running on port ${port}`));
