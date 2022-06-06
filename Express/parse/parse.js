////// QUERY PARSING //////

function parseConstructor (init) {

    return (req, res, next) => {
        // Unpack
        let { feature } = req.params; 
        let queryString = req.query;
        let include;

        // if we're doing a key query then include is empty
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
        for(let n = 0; n < include.length; n++) {
            if(isNaN(parseInt(include[n]))) {
                return res.status(400).send(`Bad Request 1601: ${include[n]} must be an integer`);
            }
            // convert to Number
            include[n] = parseInt(include[n]);
        }
    
        // Initialize filters
        let builderUnpacked = [];
        let builder = null;
        let universalFilters = {};
        
        // Construct object of parsed filters
        for(let query in queryString) {

            // check for universal filters
            if(['sorta','sortd','limit','offset','pk'].includes(query)) {
                // Universal filters must operate on integers
                if(isNaN(parseInt(queryString[query]))) {
                    return res.status(400).send(`Bad Request 1605: ${query} must take an integer`)
                }
                // Make sure the universal filter hasn't been passed twice
                if (universalFilters[query]){
                    return res.status(400).send(`Bad Request 2205: Cannot have duplicate filters`);
                } else {
                    universalFilters[query] = parseInt(queryString[query]);
                }
                continue;
            }

            // Query builder parsing
            if(query === 'builder') {
                try {
                    // Pass raw builder object
                    builder = JSON.parse(queryString[query]);

                    // Unpack each filter and validate the shape of the builder object
                    builderUnpacked = parseAndUnpackBuilder(builder);

                } catch(err) {
                    console.log(err)
                    return res.status(400).send(`Bad Request 1606: builder object is invalid`);
                }
                continue
            }
            
            return res.status(400).send(`Bad Request 1607: ${query} is not a valid query parameter`);
        }

        console.log('Filters: ', builderUnpacked)
        // attaching parsed object
        res.locals.parsed.request = "audit";
        res.locals.parsed.features = feature;
        res.locals.parsed.columns = include;
        res.locals.parsed.filters = builderUnpacked;
        res.locals.parsed.builder = builder;
        res.locals.parsed.universalFilters = universalFilters;
        next(); // passing to validate.js 

        function parseAndUnpackBuilder(builderObject) {
            console.log(builderObject)
            let filterArray = [];
            // make sure 1st element is 1 or 0 (AND or OR)
            if(![0, 1].includes(builderObject[0])) {
                throw Error('First element of each group must be 1 or 0');
            }
            for(let element of builderObject.slice(1)) {
                // Another group
                if(Array.isArray(element)) {
                    filterArray = [...filterArray, ...parseAndUnpackBuilder(element)];
                } 
                // A filter
                else {
                    // validate each filter has the necessary properties
                    if(!['id', 'op', 'val'].every(prop => Object.keys(element).includes(prop))) {
                        throw Error('Filter object must include `op`, `val`, and `id` properties');
                    }
                    filterArray.push(element);
                }
            }
            return filterArray;
        }
    }
}

////// UPLOAD PARSING ////// 

function uploadParse(req, res, next) {
    res.locals.parsed = {}; // attaching parsed object
    next(); // passing to insert.js
}

////// TEMPLATE PARSING //////

function templateParse(req, res, next) {
    // init request parse object
    res.locals.parsed = {};
    res.locals.parsed = JSON.parse(JSON.stringify(req.body));
    next(); // passing to template.js
}

////// SETUP PARSING //////

function setupParse(req, res, next) {
    // init request parse object
    res.locals.parsed = {};
    // add If-Modified-Since header
    res.locals.parsed.ifModifiedSince = req.headers['If-Modified-Since'];
    next();
}

////// END OF SETUP PARSING //////

function parseOrganizationID(req, res, next) {
    try {
        if(!req.query.organizationID || isNaN(parseInt(req.query.organizationID))) {
            return res.status(400).end();
        }

        res.locals.requestedOrganizationID = parseInt(req.query.organizationID);
        return next();
    } catch(err) {
        return res.status(500).end();
    }
}

function parseSignedUrl(req, res, next) {
    try {
        if(!req.query.organizationID || !req.query.type || !req.query.fileName || isNaN(parseInt(req.query.organizationID))) {
            return res.status(400).end();
        }

        res.locals.requestedOrganizationID = parseInt(req.query.organizationID);
        res.locals.contentType = req.query.type;
        res.locals.fileName = req.query.fileName;

        return next();
    } catch(err) {
        return res.status(500).end();
    }
}

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
    queryParse: parseConstructor('main'),
    uploadParse,
    templateParse,
    setupParse,
    timestamptzParse,
    apiDateToUTC,
    parseOrganizationID,
    parseSignedUrl,
}