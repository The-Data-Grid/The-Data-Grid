////// QUERY PARSING //////

const { compareSync } = require("bcrypt");

function operation_map(operation) {
    op = operation;
    switch(operation){
        case 'gte':
            op = '>=';
            break;
        case 'gt':
            op = '>';
            break;
        case 'lte':
            op = '<=';
            break;
        case 'lt':
            op = '<';
            break;
        case 'e':
            op = 'Exists';
            break;
        case 'dne':
            op = 'Does not exist';
            break;
        case '~':
            op = 'not';
        default:
            op = null //set op to null if non-valid operation
    }
    return op
}

function parseConstructor (init) {

    return (req, res, next) => {
        let filter = req.query;
        let {feature} = req.params; 
        let include;
        // if we're doing a key query then include is just null
        if (init == 'key') {
            include = []
        }
        else {
            include = req.params.include;
            include = include.split('&');
        }
        // init parsed values
        res.locals.parsed = {};
    
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
            if(['sorta','sortd','limit','offset', 'pk'].includes(key)) {
                universalFilters[key] = filter[key];
                continue;
            }

            // Validate filter IDs are numeric
            if(isNaN(parseInt(key))) {
                return res.status(400).send(`Bad Request 1602: filters must be numeric IDs or universals`);
            }

            // setting up custom operator
            if (typeof(filter[key]) === 'object') {
                console.log(filter[key]);

                let operationKeys = Object.keys(filter[key]);
                let operationValues = Object.values(filter[key]);

                //console.log(operationKeys);
                //console.log(operationValues);
                /*
                // get operation name
                let operation = operation_map(operationKeys)

                // if not a valid operation
                if(operation === null) {
                    return res.status(400).send(`Bad Request 1603: ${operationKeys} is not a valid operator`)
                } 
                */
            } else { // if no operator is given use = operator

            }  
        }

        // console.log(filters);

        // attaching parsed object
        res.locals.parsed.request = "audit";
        res.locals.parsed.features = feature
        res.locals.parsed.columns = include
        res.locals.parsed.filters = filters
        res.locals.parsed.universalFilters = universalFilters;
        next(); // passing to validate.js 
    }
}

////// END OF QUERY PARSING //////


////// UPLOAD PARSING ////// 

function uploadParse(req, res, next) {
    res.locals.parsed = {}; // attaching parsed object
    next(); // passing to insert.js
}

////// END OF UPLOAD PARSING //////


////// TEMPLATE PARSING //////

function templateParse(req, res, next) {
    // init request parse object
    res.locals.parsed = {};
    res.locals.parsed = JSON.parse(JSON.stringify(req.body));
    next(); // passing to template.js
}

////// END OF TEMPLATE PARSING //////


////// SETUP PARSING //////

function setupParse(req, res, next) {
    // init request parse object
    res.locals.parsed = {};
    // add If-Modified-Since header
    res.locals.parsed.ifModifiedSince = req.headers['If-Modified-Since'];
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

////// DATE PARSING //////
function timestamptzParse(s) {
    let b = s.split(/\D/);
    --b[1];                  // Adjust month number
    b[6] = b[6].substr(0,3); // Microseconds to milliseconds
    return new Date(Date.UTC(...b)).toUTCString();
}

// this will throw if date isn't validated to be MM-DD-YYYY
function apiDateToUTC(date) {
    let arr = date.split('-')
    return(new Date(arr[2] + '-' + arr[0] + '-' + arr[1]).toUTCString())
}
////// END OF TIMESTAMPTZ PARSING  //////

module.exports = {
    statsParse,
    keyQueryParse: parseConstructor('key'),
    queryParse: parseConstructor('other'),
    uploadParse,
    templateParse,
    setupParse,
    timestamptzParse,
    apiDateToUTC
}