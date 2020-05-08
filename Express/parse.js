const q = require('./query')
const sql = require('./statement.js');


const featureParse = (req, res) => {
    let filter = req.query;
    let {feature} = req.params; 
    let {include} = req.params;
    include = include.split("&");
    console.log(feature);
    console.log(include);
    console.log(filter); 
    
    // do some stuff to get filters and path in good format

   q.featureQuery(filters, path, sql, res); //send to query engine.
};