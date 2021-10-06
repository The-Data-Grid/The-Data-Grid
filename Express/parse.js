////// QUERY PARSING //////

const { compareSync } = require("bcrypt");
const e = require("express");
const { query } = require("express");
const { isNumber, indexOf, rest } = require("lodash");

function operation_map(operation) {
    switch(operation){
        case 'gte':
            operation = '>=';
            break;
        case 'gt':
            operation = '>';
            break;
        case 'lte':
            operation = '<=';
            break;
        case 'lt':
            operation = '<';
            break;
        case 'e':
            operation = 'Exists';
            break;
        case 'dne':
            operation = 'Does not exist';
            break;
        case '~':
            operation = 'not';
        default:
            operation = null; //set op to null if non-valid operation
    }
    return operation;
}

function deconstructQuery(queryStatement){
    // array with all components of query statement separated
    // ex. 65[gte]=01-20-2000 ==> {key: returnableID, op: operation, value: value} ==> {key: 65, op: gte, value: 01-20-200}
    // ex. limit=50 ==> [key: limit, op: '', value: 50]
    let deconstructedQuery = {};

    let open = queryStatement.indexOf('[');
    let close = queryStatement.indexOf(']');
    let equals = queryStatement.indexOf('=');
    let key;
    let op;
    let val;

    // get returnable ID of query as key
    let i = 0;
    while (i < queryStatement.length && Number.isInteger(parseInt(queryStatement[i])))
        ++i;
    if (i > 0)
        key = queryStatement.slice(0,i);
    else if (open !== -1 && close !== -1)
        key = queryStatement.slice(0, open);
    else
        key = queryStatement.slice(0, equals);
    
    // get operation of query as op
    if (open !== -1 && close !== -1)
        op = operation_map(queryStatement.slice(open+1, close));
    else
        op = '=';

    // get value as val
    if (equals !== -1)
        val = queryStatement.slice(equals+1);
    else
        val = '';

    deconstructedQuery = {
        key,
        op,
        val
    };

    return deconstructedQuery;
}

function separateQueries(queryStatements) {

    if (queryStatements.indexOf('?') === -1)
        return [];
    // remove query string until '?'
    queryStatements = queryStatements.substring(queryStatements.indexOf('?')+1);
    let operationIndices = [];
    let separatedQuery = [];

    // alter query string from URL encoding '%7C' to '|'
    let orCode = queryStatements.indexOf('%7C');
    while (orCode !== -1){
        queryStatements = queryStatements.substring(0, orCode) + '|' + queryStatements.substring(orCode+3);
        orCode = queryStatements.indexOf('%7C')
    }

    // determine whether any params are AND-ed or OR-ed
    if (queryStatements.indexOf("&") === -1 && queryStatements.indexOf("|") === -1) {
        separatedQuery.push(['', deconstructQuery(queryStatements)]);
    } 
    else { 
        // add each param between the ANDs and ORs
        for (let i = 0; i < queryStatements.length; i++){
            if (queryStatements[i] === "&" || queryStatements[i] === "|"){
                // add first param
                if (separatedQuery.length === 0)
                    separatedQuery.push(['', deconstructQuery(queryStatements.substring(0, i))]);
                // add params in between ANDs and ORs
                else{
                    let query = queryStatements.substring(operationIndices.slice(-1), i);
                    separatedQuery.push([query[0], deconstructQuery(query.slice(1))]);
                }   
                // add index of operation
                operationIndices.push(i);    
            }
        }
        // add last param
        let query = queryStatements.substring(operationIndices.slice(-1));
        separatedQuery.push([query[0], deconstructQuery(query.slice(1))]);
    }
    return separatedQuery;
}

function parseConstructor (init) {

    return (req, res, next) => {
        let filter = separateQueries(req.originalUrl);
        let {feature} = req.params; 
        let include;

        // if we're doing a key query then include is just null
        if (init == 'key') {
            include = [];
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
        // console.log(filter);
        let filters = [];
        let universalFilters = {};

        for (const elem in filter) {

            let isUniverisal = false;
            // check for universal filters
            if(['sorta','sortd','limit','offset','pk'].includes(Object.values(filter[elem][1])[0])) {
                universalFilters[elem] = Object.values(filter[elem][1])[2];
                isUniverisal = true;
                continue;
            }
            
            // Validate filter IDs are numeric
            if(isNaN(parseInt(elem))) {
                return res.status(400).send(`Bad Request 1602: filters must be numeric IDs or universals`);
            }
            let operation = Object.values(filter[elem][1])[1];
            // if not a valid operation
            if(operation === null) {
                return res.status(400).send(`Bad Request 1603: ${operation} is not a valid operator`);
            } 
            
            // setting up custom operator
            if (!isUniverisal) {
                // first operation
                if (filter[elem][0] === '')
                    filters.push([filter[elem][1]]);
                
                // operator for AND
                else if (filter[elem][0] === '&')
                    filters.push([filter[elem][1]]);
                
                // operator for OR
                else if (filter[elem][0] == '|'){
                    //console.log(filters);
                    filters[filters.length-1].push(filter[elem][1]);
                    //console.log(filters);
                }

                else
                    return res.status(400).send(`Bad Request 1604: ${filter[elem][0]} is not a valid operator`);
            }
        }

        console.log(filters)

        // attaching parsed object
        res.locals.parsed.request = "audit";
        res.locals.parsed.features = feature;
        res.locals.parsed.columns = include;
        res.locals.parsed.filters = filters;
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
    let arr = date.split('-');
    return(new Date(arr[2] + '-' + arr[0] + '-' + arr[1]).toUTCString());
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