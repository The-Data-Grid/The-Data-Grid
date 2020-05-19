//const q = require('./query')
const sql = require('./statement.js');

function operation_map(operation) {
    op = operation;
    switch(operation){
        case 'gte':
            op = '>='
            break
        case 'gt':
            op = '>'
            break
        case 'lte':
            op = '<='
            break
        case 'lt':
            op = '<'
            break
        case 'e':
            op = 'Exists'
            break
        case 'dne':
            op = 'Does not exist'
            break
        default:
            break
    }
    return op
}

const featureParse = (req, res) => {
    let filter = req.query;
    let {feature} = req.params; 
    let {include} = req.params;
    include = include.split("&");
    // console.log('feature = ', feature);
    // console.log('includes = ', include);
    // console.log('filters = ', filter);
    
    // do some stuff to get filters and path in good format
    filters = {}
    for (const key in filter) {
        if (typeof(filter[key]) == "object") {
            let content = Object.keys(filter[key])
            filters[key] = {
                "operation": operation_map(content[0]),
                "value": parseInt(filter[key][content[0]])
            }
        }
        else {
            filters[key] = filter[key]
        }
    }
    
//    q.featureQuery(filters, path, sql, res); //send to query engine.
    res.json({request: "f", features: feature, columns: include, filters: filters});
};

module.exports = {
    featureParse,
}