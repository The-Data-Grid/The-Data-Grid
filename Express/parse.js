////// QUERY PARSING //////

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
            op = null //set op to null if non-valid operation
    }
    return op
}

const queryParse = (req, res, next) => {
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

            if(!isNaN(filter[key][content[0]])) { //if number parseInt
                value = parseFloat(filter[key][content[0]]);
            } else {
                value = filter[key][content[0]] //else keep as string
            }
            
            let operation = operation_map(content[0])
            if(operation === null) {
                return res.status(400).json({'Bad Request': `${content[0]} is not a valid operation`})
            } else {
                filters[key] = {
                    "operation": operation_map(content[0], res),
                    "value": value
                }
            }
        }
        else {
            filters[key] = {operation: '=', value: filter[key]} // if no operator is given use = operator
        }
    }
    
    res.locals.parsed = {request: "a", features: feature, columns: include, filters: filters}; // attaching parsed object
    next(); // passing to query.js 
};

////// END OF QUERY PARSING //////

////// UPLOAD PARSING ////// 

function uploadParse(req, res, next) {
    res.locals.parsed = {}; // attaching parsed object
    next(); // passing to insert.js
}

////// END OF UPLOAD PARSING //////

////// TEMPLATE PARSING //////

function templateParse(req, res, next) {
    const obj = JSON.parse(JSON.stringify(req.body));
    res.send(obj); 
    console.log(obj); // logging object after parsing
    next(); // passing to template.js
}

////// END OF TEMPLATE PARSING //////


module.exports = {
    queryParse,
    uploadParse,
    templateParse
}