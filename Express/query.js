const dotenv = require('dotenv');
dotenv.config();

const { // will import from statement.js as single 'statement' object 
        select, 
        where, 
        whereCondition, 
        referenceSelectionJoin, 
        submission, 
        statsMostRecent, 
        statsObservations,
        statsSubmitted,
        rootFeatureJoin,
        subfeatureJoin,
        sorta,
        sortd,
        limit,
        offset
    } = require('./statement.js');

const {returnableIDLookup, featureParents} = require('./setup.js')

const {timestamptzParse} = require('./parse')

// Database info
const pgp = require('pg-promise')();
pgp.pg.types.setTypeParser(1700, parseFloat) //Parsing the NUMERIC SQL type as a JS float 
pgp.pg.types.setTypeParser(1184, timestamptzParse) //Parsing the TIMESTAMPTZ SQL type as a JS Date

const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'v4',
    user: 'postgres',
    password: null,
    max: 30 // use up to 30 connections
};
const db = pgp(cn); //db.function is used for pg-promise PostgreSQL queries

////// SETUP //////

//** Testing request response cycle time (for dev only) **//
var cycleTime = [];


////// END OF SETUP //////

////// QUERY ENGINE //////



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
    append the union of nextJoinObject subsets to builtArray

*/

const recursiveReferenceSelection = (builtArray, idAliasLookup, aliasNumber) => {
    'use strict';
    //console.log('join object:', builtArray)

    // get depth
    let depth = builtArray.length

    // get joinObject - Need to deep copy all the ref arrays to prevent mutation
    let joinObjectArray = [];
    builtArray[depth - 1].forEach(obj => {
        joinObjectArray.push({
            parentAlias: obj.parentAlias,
            ID: obj.ID,
            refs: Array.from(obj.refs) // as to not mutate returnableIDLookup
        })
    })

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
};


const string2Join = (string, prefix) => {
    let clauseArray = [];
    // string[0] = parent alias number
    //       [1] = self alias number
    //       [2] = join string itself
 
    // 0: originalTable, 1: originalColumn, 2: joinTable, 3: joinColumn
    string[2].split('>').forEach(el => {
        clauseArray.push(el.split('.')[0])
        clauseArray.push(el.split('.')[1])
    })
    
    // if parentAlias is the root feature join to the feature rather than an alias
    let originalAlias;
    (string[0] === -1 ? originalAlias = clauseArray[2] : originalAlias = prefix + string[0])

    let joinAlias = prefix + string[1]
    return(pgp.as.format(referenceSelectionJoin, {
        joinTable: clauseArray[0],
        joinAlias: joinAlias,
        joinColumn: clauseArray[1],
        originalAlias: originalAlias,
        originalColumn: clauseArray[3]
    }))

    //'LEFT JOIN $(joinTable:value) AS $(joinAlias:value) ON $(joinAlias:value).$(joinColumn:value) = $(originalAlias:value).$(originalColumn:value)'
}

// select clause helper
const formatSelectAlias = (select, id) => {
    return `${select} AS r${id.toString()}`
};

/**   small query rewrite
  * 
  * dynamicSQLEngine
  * 
  * Calls:
  *     recursiveReferenceSelection
  *     string2Join
  * 
  * @param {returnableIDLookup, featureTreeArray, feature, ...}
  * @returns {selectClauseArray, joinClauseArray, featureTreeArray, whereLookup}
  */
const dynamicSQLEngine = (returnableIDs, featureTreeArray, feature, recursiveReferenceSelection, string2Join, formatSelectAlias) => {
    // Initialize Output
    let selectClauseArray = [];
    let joinClauseArray = [];
    let whereLookup = {};

    // push the item_submission reference
    joinClauseArray.push(pgp.as.format(submission, {
        feature: feature
    }));
    
    // Handle returnables that do not have references
    let localReturnables = returnableIDs.filter(returnable => returnable.joinObject.refs.length == 0);
    localReturnables.forEach(returnable => {

        // push feature to featureTree if not a submission returnable
        if(returnable.feature !== null) {
            featureTreeArray.push(returnable.feature);
        };

        // if no sql needs to appended
        if(returnable.appendSQL === null) {
            /*  
                1. add select clause and no join, since select references either 
                item_submission or observation_..., which are joined by default'
            */
            selectClauseArray.push(formatSelectAlias(returnable.selectSQL, returnable.ID));

            /*
                2. add table.column clause to whereLookup
            */
            whereLookup[returnable.ID] = returnable.selectSQL;

        } else { // then SQL needs to be appended
            /*
                appendSQL should not have any parameters since it is joined to either the feature
                or the submission, and not a request specific alias. 

                1. add select clause
            */
            selectClauseArray.push(formatSelectAlias(returnable.selectSQL, returnable.ID));

            //  2. add join clause (from appendSQL)
            joinClauseArray.push(returnable.appendSQL);

            //  3. add table.column clause to whereLookup
            whereLookup[returnable.ID] = returnable.selectSQL;
        };
    });

    // Handle returnables with references
    let referencedReturnables = returnableIDs.filter(returnable => returnable.joinObject.refs.length != 0)

    // get all join objects for reference selection
    let joinObjects = referencedReturnables.map(returnable => returnable.joinObject);

    // perform reference selection to trim join tree and assign aliases
    // @call recursiveReferenceSelection
    let joinSelectionObject = recursiveReferenceSelection([joinObjects], {}, 1)

    let builtArray = joinSelectionObject.builtArray;
    let idAliasLookup = joinSelectionObject.idAliasLookup;

    // Convert join strings into valid SQL with assigned alias
    builtArray.forEach(join => {
        joinClauseArray.push(string2Join(join, 'a'))
    });

    referencedReturnables.forEach(returnable => {

        // push feature to featureTree if not a submission returnable
        if(returnable.feature !== null) {
            featureTreeArray.push(returnable.feature);
        };
        
        // get alias from rRS output
        let alias = 'a' + idAliasLookup[returnable.ID.toString()];

        // if appendSQL get alias from idAliasLookup and interpolate into appendSQL. Then add select and where based on known value
        if(returnable.appendSQL !== null) {

            // interpolate and push
            let append = pgp.as.format(returnable.appendSQL, {
                alias: alias
            });

            joinClauseArray.push(append)

            // add select
            selectClauseArray.push(formatSelectAlias(returnable.selectSQL, returnable.ID));

            // add table.column clause to whereLookup
            whereLookup[returnable.ID] = returnable.selectSQL;

        } else { // then no appendSQL and alias must be interpolated into select and where clauses

            // interpolate join alias into select
            let select = pgp.as.format(returnable.selectSQL, {
                alias: alias
            });

            // add select
            selectClauseArray.push(formatSelectAlias(select, returnable.ID));

            // add table.column clause to whereLookup
            whereLookup[returnable.ID] = select;
        };
    });

    return({
        selectClauseArray,
        joinClauseArray,
        featureTreeArray,
        whereLookup
    });
};

/**
 * Performs construction of dynamic SQL with request parameters
 * 
 * out: SQL query as a string
 */

function featureQuery(req, res, next) {   
    
    // array of IDs with table name and column name for WHERE clauses
    /////////let whereLookup = {};
    // array of select clauses
    let selectClauses = [];
    // array of all features in feature tree (features and subfeatures)
    let featureTree = [];
    // get feature and add to feature tree
    const feature = 'observation_' + res.locals.parsed.features;
    featureTree.push(feature);
    // set alias number
    let aliasNumber = 1;

    // get all ids
    // if sorting then add ID of the column to sort to allIDs
    let sortID = [];
    if(Object.keys(res.locals.parsed.universalFilters).includes('sorta')) {
        sortID.push(res.locals.parsed.universalFilters.sorta)
    } else if(Object.keys(res.locals.parsed.universalFilters).includes('sortd')) {
        sortID.push(res.locals.parsed.universalFilters.sortd)
    }

    // array of unique IDs from returned columns and filters
    let allIDs = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters)).concat(sortID))];
    // array of returnableID objects from IDs 
    let allReturnableIDs = allIDs.map((ID) => returnableIDLookup.filter(returnable => returnable.ID == ID)[0]);


    let {
        selectClauseArray,
        joinClauseArray,
        featureTreeArray,
        whereLookup
    } = dynamicSQLEngine(allReturnableIDs, featureTree, feature, recursiveReferenceSelection, string2Join, formatSelectAlias);

    console.log(joinClauseArray, featureTreeArray, whereLookup, selectClauseArray)

    /*

    // SUBMISSION
    // ==================================================
    let submissionReturnableIDs = allReturnableIDs.filter((returnable) => returnable.feature === null);
    let submissionClauseArray = [];
    // first push the tdg_submission reference
    submissionClauseArray.push(pgp.as.format(submission, {
        feature: feature
    }))

    // if submission returnables exist
    if(submissionReturnableIDs.length >= 1) {
        // get all join objects in request
        let joins = submissionReturnableIDs.filter(returnable => returnable.joinObject.refs.length > 0);
        let joinObjects = joins.map(returnable => returnable.joinObject);
        let locals = submissionReturnableIDs.filter(returnable => returnable.joinObject.refs.length == 0);



        // perform reference selection to trim join tree and assign aliases
        let joinArray = recursiveReferenceSelection([joinObjects], {}, aliasNumber)

        console.log(joinArray);

        console.log(submissionClauseArray)

        // make joins and add to clauseArray
        for(let join of joinArray.builtArray) {
            submissionClauseArray.push(string2Join(join, 's', ('ITEM_SUBMISSION')))
        }

        console.log(submissionClauseArray)

        // add local selects
        locals.forEach(returnable => {
            selectClauses.push(pgp.as.format(returnable.selectSQL, {
                alias: 'item_submission'
            }))
        });

        
    }



    // LISTS AND SPECIAL
    // ==================================================
    let listAndSpecialReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'list' || returnable.returnType == 'special')
    let listAndSpecialClauseArray = []
    if(listAndSpecialReturnableIDs.length >= 1) {
        for(let returnable of listAndSpecialReturnableIDs) {
            // Adding the custom join clause
            listAndSpecialClauseArray.push(returnable.joinSQL)
            // Adding the select clause
            selectClauses.push(returnable.selectSQL)
            // Adding the feature dependency
            featureTree.push(returnable.feature)
            // add table and column to whereLookup
            whereLookup[returnable.ID] = returnable.selectSQL
        }
    }

    // ITEM AND LOCATION
    // ==================================================
    let dynamicReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'location' || returnable.returnType == 'item')
    let dynamicClauseArray = [];
    if(dynamicReturnableIDs.length >= 1) {
        // get all join objects in request
        let joins = dynamicReturnableIDs.map(returnable => returnable.joinObject)
        
        // perform reference selection to trim join tree and assign aliases
        let joinArray = recursiveReferenceSelection([joins], {}, aliasNumber)
        console.log('BA')
        console.log(joinArray.builtArray)
        console.log('IDAL')
        console.log(joinArray.idAliasLookup)

        // make joins and add to clauseArray
        for(let join of joinArray.builtArray) {
            dynamicClauseArray.push(string2Join(join, 'd', feature))
        }
        // add selections to selectClauses
        for(let returnable of dynamicReturnableIDs) {
            // get alias and interpolate into select
            let alias = 'd' + joinArray.idAliasLookup[String(returnable.ID)]
            selectClauses.push(pgp.as.format(returnable.selectSQL, {
                table: alias
            }))
            // add feature to featureTree
            featureTree.push(returnable.feature)
            // add table and column to whereLookup
            whereLookup[returnable.ID] = alias + '.' + returnable.dataColumn
        }
    }

    // LOCAL AND LOCAL-GLOBAL
    // ==================================================
    let localReturnableIDs = allReturnableIDs.filter((returnable) => returnable.returnType == 'local' || returnable.returnType == 'local-global')
    if(localReturnableIDs.length >= 1) {
        for(let returnable of localReturnableIDs) {
            // Adding the select clause
            selectClauses.push(pgp.as.format(returnable.selectSQL, {
                table: feature
            }))
            // Adding the feature dependency
            featureTree.push(returnable.feature)
            // add table and column to whereLookup
            whereLookup[returnable.ID] = returnable.feature + '.' + returnable.dataColumn
        }
    }

    */


    // Throw error if the length of the ID set is not equal to the sum of its partitions
    if(Object.keys(whereLookup).length != allIDs.length) {        
        return res.status(500).send('Internal Server Error 7701: Number of columns found different than number of columns requested')
    }
    
    // use aliases to input SELECTs
    // use aliases to input WHEREs
    // concat SQL and query db
    // construct tableObject from results 

    // FEATURE CLAUSES
    // ==================================================
    let featureClauseArray = [];
    //let subfeatures = Object.keys(featureParents).filter(key => featureParents[key] !== null).map(key => [key, featureParents[key]]);
    let rootFeature = feature

    // Add root feature join
    featureClauseArray.push(pgp.as.format(rootFeatureJoin, {
        rootFeature: rootFeature
    }))

    featureTree = [...new Set(featureTree)]

    // remove root feature from feature tree after join
    featureTree.splice(featureTree.indexOf(rootFeature), 1)

    let currentFeature = [rootFeature]

    // while still features to join, join them
    while(featureTree.length > 0) {

        let nextCurrentFeature = [];

        // for all of the curent features
        currentFeature.forEach(parent => {
            // get the features that depend on 
            featureTree.forEach(child => {
                // if feature in tree is dependent on currentFeature
                if(featureParents[child] == parent) {

                    // add it to be a next current feature
                    nextCurrentFeature.push(child)

                    // join the feature
                    featureClauseArray.push(pgp.as.format(subfeatureJoin, {
                        feature: parent,
                        subfeature: child
                    }))
                }
            })

            // remove added features from featureTree
            nextCurrentFeature.forEach(addition => {
                featureTree.splice(featureTree.indexOf(addition), 1)
            })
            
        })

        // update current feature
        currentFeature = Array.from(nextCurrentFeature)
    }

    // WHERE CLAUSES
    // ==================================================
    let whereClauseArray = [];
    let initialWHERE = true;

    for(let ID in res.locals.parsed.filters) {

        let out = {}
        // The first clause must be WHERE and the following clauses must be AND
        if(initialWHERE == true) {     
            out.clause = 'WHERE';
            initialWHERE = false;
        } else {
            out.clause = 'AND'
        }

        // Getting the clause components
        // if multiple values passed then implement logical OR
        if(Array.isArray(res.locals.parsed.filters[ID].value)) {
            let condition = [];
            res.locals.parsed.filters[ID].value.forEach(value => {
                condition.push(pgp.as.format(whereCondition, {
                    select: whereLookup[String(ID)],
                    operation: res.locals.parsed.filters[ID].operation,
                    filterValue: value
                }))
            })
            out.condition = condition.join(' OR ')
        } else {
            out.condition = pgp.as.format(whereCondition, {
                select: whereLookup[String(ID)],
                operation: res.locals.parsed.filters[ID].operation,
                filterValue: res.locals.parsed.filters[ID].value
            })
        }
        whereClauseArray.push(pgp.as.format(where, out));
    }

    // UNIVERSAL FILTERS
    // ==================================================
    // Applying sorta, sortd, limit, and offset universal filters
    let universalFilterArray = [];

    // default limit of 100 rows
    let universalLimit = pgp.as.format(limit, {
        limit: 100
    });

    // default no offset
    let universalOffset = pgp.as.format(offset, {
        offset: 0
    });

    // default sort by time submitted
    let universalSort = pgp.as.format(sorta, {
        columnName: 'item_submission.data_time_submitted'
    });

    if(Object.keys(res.locals.parsed.universalFilters).length > 0) {
        for(universal in res.locals.parsed.universalFilters) {
            if(universal === 'sorta') {
                universalSort = pgp.as.format(sorta, {
                    columnName: whereLookup[res.locals.parsed.universalFilters[universal]]
                })
            } else if(universal === 'sortd') {
                universalSort = pgp.as.format(sortd, {
                    columnName: whereLookup[res.locals.parsed.universalFilters[universal]]
                })
            } else if(universal === 'limit') {
                universalLimit = pgp.as.format(limit, {
                    limit: res.locals.parsed.universalFilters[universal]
                })
            } else if(universal === 'offset') {
                universalOffset = pgp.as.format(offset, {
                    offset: res.locals.parsed.universalFilters[universal]
                })
            }
        }
    } 

    universalFilterArray.push(universalSort)
    universalFilterArray.push(universalLimit)
    universalFilterArray.push(universalOffset)

    // EXECUTING QUERY
    // ==================================================
    // Adding commas to select clauses
    selectClauseArray = selectClauseArray.join(', ')
    selectClauseArray = `SELECT ${selectClauseArray}`

    console.log(featureClauseArray);
    
    
    // Adding clauses to query in order
    let query = [selectClauseArray, ...featureClauseArray, ...joinClauseArray, ...whereClauseArray, ...universalFilterArray]; 
    console.log(query)
    // Concatenating clauses to make final SQL query
    let finalQuery = query.join(' '); 

     // DEBUG: Show SQL Query //
     console.log(finalQuery); 

    // Finally querying the database
    db.result(finalQuery)  
        .then(data => {

            res.locals.parsed.finalQuery = data;

            next();
            console.log(data.fields)
            // Constructing the tableObject and sending response
            //return res.json(data)
            // will write this soon!
            //return res.json(makeTableObject(data));

        }).catch(err => {

            console.log(err)
            // Error
            return res.status(500).send(`<center><h3>Internal Server Error 1702: Malformed Query</h3></center><hr><center>&copy The Data Grid ${new Date().getFullYear()}<center>`);
            
        });
}

async function statsQuery(req, res, next) {

    try { 
        
        let observations = await db.one(statsObservations);
        let submitted = await db.one(statsSubmitted);
        let mostRecent = await db.one(statsMostRecent);

        let statsResponse = {
            observations,
            submitted,
            mostRecent
        };

        return res.json(statsResponse);

    } catch(err) {

        res.status(500).send('Internal Server Error: 1703: Stats Query Error')

    }
    
}

function returnData(req, res) {
    let returnableColumnIDs = res.locals.parsed.finalQuery.fields.map(field => field.name);

    let rowData = returnableColumnIDs.map(e => null);

    // fill the rows
    returnableColumnIDs.forEach((field, i) => {
        rowData[i] = res.locals.parsed.finalQuery.rows.map(row => row[field])
    })



    res.json({
        returnableColumnIDs: returnableColumnIDs,
        rowData: rowData
    });
};


module.exports = {
    featureQuery,
    statsQuery,
    auditQuery,
    setupQuery,
    cycleTime,
    returnData
};

