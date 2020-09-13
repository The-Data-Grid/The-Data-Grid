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
    include = include.split('&');

    // Validate column IDs are numeric
    for(let id of include) {
        if(isNaN(parseInt(id))) {
            return res.status(400).send(`Bad Request 1601: ${id} must be numeric`);
        }
    }

    // console.log('feature = ', feature);
    // console.log('includes = ', include);
    // console.log('filters = ', filter);
    
    // Construct object of parsed filters
    let filters = {};
    let universalFilters = {};
    for (const key in filter) {

        // check for universal filters
        if(['sorta','sortd','limit','offset'].includes(key)) {
            universalFilters[key] = filter[key]
            continue
        }

        // Validate filter IDs are numeric
        if(isNaN(parseInt(key))) {
            return res.status(400).send(`Bad Request 1602: filters must be numeric IDs or universals`);
        }

        // setting up custom operator
        if (typeof(filter[key]) === 'object') {
            let content = Object.keys(filter[key])

            if(!isNaN(filter[key][content[0]])) { //if number parseInt
                value = parseFloat(filter[key][content[0]]);
            } else {
                value = filter[key][content[0]] //else keep as string
            }
            
            let operation = operation_map(content[0])
            if(operation === null) {
                return res.status(400).send(`Bad Request 1603: ${content[0]} is not a valid operator`)
            } else {
                filters[key] = {
                    operation: operation_map(content[0], res),
                    value: value
                }
            }
        } else { // if no operator is given use = operator
            filters[key] = {
                operation: '=', 
                value: filter[key]} 
        }
    }

    // attaching parsed object
    res.locals.parsed = {request: "a", features: feature, columns: include, filters: filters, universalFilters: universalFilters};
    next(); // passing to validate.js 
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
    res.locals.parsed = JSON.parse(JSON.stringify(req.body));
    next(); // passing to template.js
}

////// END OF TEMPLATE PARSING //////


////// SETUP PARSING //////

function setupParse(req, res, next) {
    res.locals.parsed = JSON.parse(JSON.stringify(req.body));
    next();
}

////// END OF SETUP PARSING //////

////// STATS PARSING //////
// ==================================================
// No parsing needed for stats query
// ==================================================
function statsParse(req, res, next) {
    next();
}
// ==================================================
////// END OF STATS PARSING //////

module.exports = {
    statsParse,
    queryParse,
    uploadParse,
    templateParse,
    setupParse
}