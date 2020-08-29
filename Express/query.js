const dotenv = require('dotenv');
dotenv.config();

const {select, where, referenceSelectionJoin, submission} = require('./statement.js');
const validate = require('./validate.js');
const {returnableIDLookup} = require('./setup.js')

// Database info
const pgp = require('pg-promise')();
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 

const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tdg_db_new',
    user: 'postgres',
    password: null,
    max: 30 // use up to 30 connections
};
const db = pgp(cn); //db.function is used for pg-promise PostgreSQL queries

////// SETUP //////

//** Testing request response cycle time (for dev only) **//
var cycleTime = [];

/*

//// Column to Table Relationships ////

//  All table join clauses for each feature to be filtered
const joinClauseTables = {
    toilet: {...commonJoin, ...toiletJoin},
    urinal: {...commonJoin, ...urinalJoin},
    sink: {...commonJoin, ...sinkJoin},
    mirror: {...commonJoin, ...mirrorJoin},
    room: commonJoin
};

// All table names for each feature to be filtered
const joinClauseTableNames = {
    toilet: Object.keys(commonJoin).concat(Object.keys(toiletJoin)),
    urinal: Object.keys(commonJoin).concat(Object.keys(urinalJoin)),
    sink: Object.keys(commonJoin).concat(Object.keys(sinkJoin)),
    mirror: Object.keys(commonJoin).concat(Object.keys(mirrorJoin)),
    room: Object.keys(commonJoin)
};

// Getting all Column to Table Relations for each feature request
async function tableLookupSetup() {
    const setup = await db.many("select c.column_name, t.table_name from information_schema.tables as t inner join information_schema.columns as c on t.table_name = c.table_name where t.table_schema = 'public' and t.table_type = 'BASE TABLE'");
    var validLookup = {};
    for(feature of validateFeatures) {
        validLookup[feature] = setup.filter(pair => joinClauseTableNames[feature].includes(pair.table_name)) //this is crazy
    }
}

tableLookupSetup();

// Getting tables of columns and filters in request
function tableLookup(feature, columns, res) {
    let out = {}
    for(let column of columns) {
        let match = validLookup[feature].filter(pair => pair.column_name == column);
        if(match.length == 1) {
            out[column] = match[0].table_name;
        } else if(match.length == 0) {
            out[column] = null;
        } else {
            console.log('Error code 101: One column matched to multiple tables. This shouldn\'t happen! Error is within query.js');
            res.status(500).json({'Server Error': 'Error code 101: One column matched to multiple tables. Please email admin@thedatagrid.org for help'});
        };
    };
    return out
};

// Formatting column to table relationships as 'table.column'
function columnTableFormat(lookup, feature) {
    let out = {}
    for(let column in lookup) {
        if(lookup[column] === null) {
            out[column] = 'audit_' + feature + '.' + column;
        } else {
            out[column] = lookup[column] + '.' + column;
        };
    };
    return out
};

////// END OF SETUP //////

*/
////// QUERY ENGINE //////

function featureQuery(req, res) {  

    
    //// Formatting the data
    let data = {};    // values object for SELECT and JOINS
    let query = [];    // array of clauses that make up the query
    data.feature = 'audit_' + res.locals.parsed.features;
    let allJoins = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))]; //array of unique columns from returned columns and filters
    let columnToTable = tableLookup(res.locals.parsed.features, allJoins, res);  // each column has a unique table
    let columnAndTable = columnTableFormat(columnToTable, res.locals.parsed.features);  // table.column syntax for SELECT and WHERE

    //// SELECT Clause
    data.returnColumns = res.locals.parsed.columns.map(element => {return columnAndTable[element]}).join(', ') // transforms each column to table.column
    query.push(pgp.as.format(select.query, data));

    //// JOIN Clauses
    let tables = [...new Set(allJoins.map(element => {return columnToTable[element]}))]; // get list of unique needed tables
    tables = tables.filter(table => table != null);
    for(let table of tables) {  // adding dependent joins  
        joinClauseTables[res.locals.parsed.features][table].dependencies.forEach(dependency => {tables.push(dependency)});
    };
    tables = [...new Set(tables)]; // removing duplicates again

    // Sorting table order by number of dependencies length 
    // Note: By getting the tables we could calculate the hiearchy and get order from that
    sortTables = {}
    for(let table of tables) {
        sortTables[table] = joinClauseTables[res.locals.parsed.features][table].dependencies.length;
    };
    let tableEntries = Object.keys(sortTables).sort((a,b) => sortTables[a] - sortTables[b])

    // Pushing each join to the query in order 
    for(let table of tableEntries) {  
        query.push(pgp.as.format(joinClauseTables[res.locals.parsed.features][table].query, data))  
    }; 

    //// WHERE Clauses
    let initialWHERE = true;
    for(let filter in res.locals.parsed.filters) {
        let out = {}
        if(initialWHERE == true) {          // The first clause must be WHERE and the following clauses must be AND
            out.clause = 'WHERE';
            initialWHERE = false;
        } else {
            out.clause = 'AND'
        }
        out.filterColumns = columnAndTable[filter]; //getting the correct table.column string
        out.value = res.locals.parsed.filters[filter].value
        out.operation = res.locals.parsed.filters[filter].operation
        query.push(pgp.as.format(where.query, out));
    }
    

    /*

    let data = {};    // values object for SELECT and JOINS
    let query = [];    // array of clauses that make up the query
    data.feature = 'feature_' + res.locals.parsed.features;
    let IDs = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))]; //array of unique columns from returned columns and filters

    // Getting returnableID class from ID
    IDs = IDs.map((id) => setup.returnableIDLookup[id.toString()])

    let submissionIDs = IDs.filter((id) => id.returnType == 'submission');

    let standardIDs = IDs.filter((id) => id.returnType == 'local' || 'item' || 'location');

    let listIDs = IDs.filter((id) => id.returnType == 'list');

    if(submissionIDs.length + standardIDs.length + listIDs.length != IDs.length) {
        // res.status(500).send('AAAAAA fuck')
    }

    // Submission JOINs

    let refSelection = [];
    submissionIDs.forEach((submission, index) => {
        refSelection.push(submission)
    })

    */

    /*
    for IDs where type = submission
        id42, id31, id7 -> abc, abd, ace
            -> a[b[cd]ce]
                -> joined to submission
    
    for IDs where type = special (obs count)
        id12, id4-> a, b
            -> joined to 
    

    // Concatenating clauses to make final SQL query
    let finalQuery = query.join(' ') + ';'; 

     // DEBUG: Show SQL Query //
     console.log(finalQuery); 
    
    // Testing request response cycle time (for dev only) //
    cycleTime.push(Date.now())
    console.log('query.js query - ' + cycleTime[1] - cycleTime[0], ' ms');

    // Finally querying the database
    db.any(finalQuery)  
        .then(data => {

            // DEBUG: Show response object //
            console.log(data); 

            //  Testing request response cycle time (for dev only) //
            cycleTime.push(Date.now())
            console.log('query.js response - ' + cycleTime[2] - cycleTime[0], 'ms');
            cycleTime = []
            

            return res.json(data);

        }).catch(err => {

            // add internal error code
            return res.status(500).send('<some error>');

            console.log(err)
        });
};

*/

let setupQuery = (req, res) => {
    res.json(app.locals.setup);
};

let auditQuery = (filters, path, sql, res) => {
    // do some stuff
};

/*
for set of joinObjects with the same parent
    compare 1st element of refs
    create a new set of unique refs and generate aliases
    create the subset of the next refArray for that parent with parent, aliases, and refs
    create the subset of the next joinObject for that parent with parent=alias, id=id, and ref=ref[-1]
    if (refs.length == 0)
        append to idAliasLookup id=id, alias=alias and don't append to joinObject
replace the last element of builtArray with the union of nextRefArray
if (nextJoinObject.length == 0)
    return
else 
    append the union of nextJoinObject subsets to builtArray

*/

function recursiveReferenceSelection(builtArray, idAliasLookup, aliasNumber) {
    // get depth
    let depth = builtArray.length
    // get joinObject
    let joinObjectArray = builtArray[depth - 1]
    // partition joinObject based on parent
        // get parents
        let joinObjectArrayParents = joinObjectArray.map(element => element.parentAlias)
        // get unqiue parents
        let uniqueJoinObjectArrayParents = [...new Set(joinObjectArrayParents)]
        // create object of unique parents
        let joinObjectArrayPartition = {}
        uniqueJoinObjectArrayParents.forEach(parent => {
            joinObjectArrayPartition[parent] = []
        })
        // add joinObjects to respective parents in unique parents object
        for(let obj of joinObjectArray) {
            joinObjectArrayPartition[obj.parentAlias].push(obj)
        }
    // create nextRefArray and nextJoinObjectArray
    let nextRefArray = []
    let nextJoinObjectArray = []
    // for parent partition of joinObjects
    //console.log(joinObjectArrayPartition)
    for(let parent in joinObjectArrayPartition) {
        //console.log(parent)
        // get unqiue references
        let uniqueRefs = [...new Set(joinObjectArrayPartition[parent].map(joinObject => joinObject.refs[0]))]
        // generate aliases for refs
        let uniqueAliases = uniqueRefs.map(() => aliasNumber++)
        // create nextRefArray for partion and add to nextRefArray
        let partitionNextRefArray = uniqueRefs.map((ref, i) => [parseInt(parent), uniqueAliases[i], ref])
        //console.log(partitionNextRefArray)
        partitionNextRefArray.forEach(refArray => {
            nextRefArray.push(refArray)
        })
        // create next joinObject or add to idAliasLookup if done
        joinObjectArrayPartition[parent].forEach(joinObject => {
            // remove last ref
            let parentAlias = joinObject.refs.splice(0, 1)[0]
            //console.log(parentAlias)
            //console.log(uniqueRefs.indexOf(parentAlias))
            // get alias for last ref
            //console.log(uniqueAliases)
            parentAlias = uniqueAliases[uniqueRefs.indexOf(parentAlias)]
            //console.log(parentAlias)
            // if no more refs
            if(joinObject.refs.length == 0) {
                idAliasLookup[joinObject.ID] = parentAlias
            } else { // more refs
                nextJoinObjectArray.push({
                    parentAlias: parentAlias,
                    ID: joinObject.ID,
                    refs: joinObject.refs
                })
            }
        }) 
    }
    // replace the last element of builtArray with the union of refArray partitions
    builtArray[depth - 1] = nextRefArray
    // if the selection is complete
    if (nextJoinObjectArray.length == 0) {
        // flatten builtArray
        let output = [];
        builtArray.forEach(arr => {
            arr.forEach(arr => {
                output.push(arr)
            })
        })
        // return and finish
        return({
            builtArray: output,
            idAliasLookup: idAliasLookup
        })
    } else { // then there are more joins
        console.log('====================iter')
        // append the next joinObjectArray to builtArray
        builtArray.push(nextJoinObjectArray)
        // recursively call the function
        return recursiveReferenceSelection(builtArray, idAliasLookup, aliasNumber)
    }
}

function makeJoinStrings(idArray) {
    let joinListLookup = [];
    let joinListIDLookup = idArray.map(returnable => [returnable.ID, returnable.joinList])

    joinListIDLookup.forEach((joinID) => {
        let ID = joinID[0]
        let parentAlias = 0
        let refs = null
        if(joinID[1] !== null) {
            let joinListArray = [];
            // create unique string for join
            joinID[1].forEach(join => {
                joinListArray.push(`${join.originalTable}.${join.originalColumn}>${join.joinTable}.${join.joinColumn}`)
            })
            // add id and unique string to array
            refs = joinListArray.reverse()
        }
        joinListLookup.push({parentAlias: parentAlias, ID: ID, refs: refs})
    })

    return joinListLookup
}

function string2Join(string, prefix) {
    // 0: originalTable, 1: originalColumn, 2: joinTable, 3: joinColumn
    let clauseArray = [];
    strings[2].split('>').forEach(el => {
        clauseArray.push(el.split('.')[0])
        clauseArray.push(el.split('.')[1])
    })
    let originalAlias = prefix + string[0]
    let joinAlias = prefix + string[1]
    return(pgp.as.format(referenceSelectionJoin, {
        joinTable: clauseArray[2],
        joinAlias: joinAlias,
        joinColumn: clauseArray[3],
        originalAlias: originalAlias,
        originalColumn: clauseArray[1]
    }))
}
 
let featureQuery = (req, res) => {
    // array of clauses that make up the query
    let query = [];    
    // get feature
    const feature = 'tdg_' + res.locals.parsed.features;
    // set alias number
    let aliasNumber = 1
    // get all ids
    // array of unique IDs from returned columns and filters
    let allIDs = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)))];
    // array of returnableID objects from IDs
    let allReturnableIDs = allIDs.map((ID) => returnableIDLookup.filter(returnable => returnable.ID == ID))
    // SUBMISSION
    // ==================================================
    let submissionReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'submission')
    let submissionClauseArray = []
    // if submission returnables exist
    if(submissionReturnableIDs.length >= 1) {
        // first push the tdg_submission reference
        submissionClauseArray.push(pgp.as.format(submission, {
            feature: feature
        }))
        // make unique join strings
        let joins = makeJoinStrings(submissionReturnableIDs)
        // perform reference selection to trim join tree
        let joinArray = recursiveReferenceSelection([joins], {}, aliasNumber)
        // make joins and add to clauseArray
        for(let join of joinArray.builtArray) {
            submissionClauseArray.push(string2Join(join, 's'))
        }
    }
    // LISTS
    // ==================================================
    let listReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'list')
    if(listReturnableIDs.length >= 1) {

    }
    /*
        in: joinSQL, selectSQL
        out: auditing dependency
    special
    */
    let specialReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'special')
    if(specialReturnableIDs.length >= 1) {
        
    }
    /*
        in: joinSQL, selectSQL
        out: auditing dependency
    local, item, location
    */
    let dynamicReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'local' || 'location' || 'item' || 'local-global')
    if(dynamicReturnableIDs.length >= 1) {

    }
    /*

        in: joinList, data column
        out: auditing dependency
    */
    // Throw error if the length of the ID set is not equal to the sum of its partitions
    if(submissionReturnableIDs.length + listReturnableIDs.length + specialReturnableIDs.length + dynamicReturnableIDs.length != allIDs.length) {
        return res.status(500).send('Internal Server Error 7701: Number of columns found different than number of columns requested')
    }
    /*
    feature tree
        in: auditing dependencies
        out: auditing joins and aliases
    */
    // use aliases to input SELECTs
    // use aliases to input WHEREs
    // concat SQL and query db
    // construct tableObject from results 
}


let allIDs = [1,2,32,8];
let allReturnableIDs = allIDs.map((ID) => returnableIDLookup.filter(returnable => returnable.ID == ID))
console.log(allReturnableIDs)







module.exports = {
    featureQuery,
    auditQuery,
    setupQuery,
    cycleTime
};

