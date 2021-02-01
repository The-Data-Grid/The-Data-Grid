// SQL statements
const {
        select, 
        where, 
        whereCondition, 
        groupBy,
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
    } = require('./statement.js').query;

// Internal setup objects
const {returnableIDLookup, featureParents, setupObject} = require('./setup.js')

// Database connection and SQL formatter
const {postgresClient} = require('./db/pg.js');
// get connection object
const db = postgresClient.getConnection.db
// get SQL formatter
const formatSQL = postgresClient.format;

// SQL query engine
const queryEngine = require('./queryEngine.js');

// Lodash array for deep comparison
var lodashArray = require('lodash/array');
var lodashLang = require('lodash/lang');

// csv parser
const {writeToBuffer} = require('@fast-csv/format');


// Testing request response cycle time (for dev only)
var cycleTime = [];


/**
 * Performs construction of dynamic SQL with request parameters
 * 
 * out: SQL query as a string
 */

async function featureQuery(req, res, next) {   

    try {

        // array of all features in feature tree (features and subfeatures)
        let featureTree = [];
        // get feature and add to feature tree
        const feature = 'observation_' + res.locals.parsed.features;
        featureTree.push(feature);

        // if sorting then add ID of the column to sort to allIDs
        let sortID = [];
        if(Object.keys(res.locals.parsed.universalFilters).includes('sorta')) {
            sortID.push(res.locals.parsed.universalFilters.sorta)
        } else if(Object.keys(res.locals.parsed.universalFilters).includes('sortd')) {
            sortID.push(res.locals.parsed.universalFilters.sortd)
        }

        // array of unique IDs from:
        // 1. returned columns
        // 2. returned filters
        // 3. column to sort by
        let allIDs = [...new Set(res.locals.parsed.columns.concat(Object.keys(res.locals.parsed.filters), sortID))];

        // array of returnableID objects from IDs 
        let allReturnableIDs = allIDs.map((id) => returnableIDLookup[id])

        // A lot happens here... The query engine contains an algorithm that trims unneeded joins, asigns aliases to arbitrary columns, stores a lookup of
        // aliases for the where clause, does some SQL formatting, and a bit more.
        let {
            selectClauseArray,
            joinClauseArray,
            featureTreeArray,
            whereLookup
        } = queryEngine(allReturnableIDs, featureTree, feature);


        // Throw error if the length of the ID set is not equal to the sum of its partitions
        if(Object.keys(whereLookup).length != allIDs.length) {        
            return res.status(500).send('Internal Server Error 7701: Number of columns found different than number of columns requested')
        }

        const featureClauseArray = makeFeatureClauseArray(feature, featureTreeArray);

        const whereClauseArray = makeWhereClauseArray(whereLookup);

        const universalFilterArray = makeUniversalFilters(whereLookup);

        const groupByClause = makeGroupByClause(allReturnableIDs, feature);

        // EXECUTING QUERY
        // ==================================================
        // Adding commas to select clauses
        selectClauseArray = selectClauseArray.join(', ')
        let selectClause = formatSQL(select, {
            feature: feature,
            selectClauses: selectClauseArray
        });

        let tester = formatSQL('INNER JOIN tdg_observation_count on $(feature:name).observation_count_id = tdg_observation_count.observation_count_id', {
            feature: feature
        })

        // Adding clauses to query in order
        let query = [selectClause, ...featureClauseArray, tester, ...joinClauseArray, ...whereClauseArray, groupByClause, ...universalFilterArray]; 

        // Concatenating clauses to make final SQL query
        let finalQuery = query.join(' '); 
        
        // DEBUG: Show SQL Query //
        // console.log(finalQuery); 

        // Finally querying the database and attaching the result
        res.locals.parsed.finalQuery = await db.result(finalQuery)
        // also attaching the returnableIDs 
        res.locals.parsed.finalReturnableIDs = allIDs.map(e => parseInt(e));

        // passing to the response handler
        next()

    } catch(err) {

        console.log(err)
        // Error
        return res.status(500).send(`<center><h3>Internal Server Error 1702: Malformed Query</h3></center><hr><center>&copy The Data Grid ${new Date().getFullYear()}<center>`);
        
    }

    // HELPER FUNCTIONS //

    // FEATURE CLAUSES
    // ==================================================
    function makeFeatureClauseArray(feature, featureTreeArray) {
        let featureClauseArray = [];
        //let subfeatures = Object.keys(featureParents).filter(key => featureParents[key] !== null).map(key => [key, featureParents[key]]);
        let rootFeature = feature
    
        // Add root feature join
        featureClauseArray.push(formatSQL(rootFeatureJoin, {
            rootFeature: rootFeature
        }))
    
        featureTree = [...new Set(featureTreeArray)]
    
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
                        featureClauseArray.push(formatSQL(subfeatureJoin, {
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

        return featureClauseArray;
    }
    

    // WHERE CLAUSES
    // ==================================================
    function makeWhereClauseArray(whereLookup) {
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
                    condition.push(formatSQL(whereCondition, {
                        select: whereLookup[String(ID)],
                        operation: res.locals.parsed.filters[ID].operation,
                        filterValue: value
                    }))
                })
                out.condition = condition.join(' OR ')
            } else {
                out.condition = formatSQL(whereCondition, {
                    select: whereLookup[String(ID)],
                    operation: res.locals.parsed.filters[ID].operation,
                    filterValue: res.locals.parsed.filters[ID].value
                })
            }
            whereClauseArray.push(formatSQL(where, out));
        }

        return whereClauseArray;
    }

    // UNIVERSAL FILTERS
    // ==================================================
    function makeUniversalFilters(whereLookup) {
        // Applying sorta, sortd, limit, and offset universal filters
        let universalFilterArray = [];

        // default limit of 100 rows
        let universalLimit = formatSQL(limit, {
            limit: 100
        });

        // default no offset
        let universalOffset = formatSQL(offset, {
            offset: 0
        });

        // default sort by time submitted
        let universalSort = formatSQL(sorta, {
            columnName: 'item_submission.data_time_submitted'
        });

        if(Object.keys(res.locals.parsed.universalFilters).length > 0) {
            for(universal in res.locals.parsed.universalFilters) {
                if(universal === 'sorta') {
                    universalSort = formatSQL(sorta, {
                        columnName: whereLookup[res.locals.parsed.universalFilters[universal]]
                    })
                } else if(universal === 'sortd') {
                    universalSort = formatSQL(sortd, {
                        columnName: whereLookup[res.locals.parsed.universalFilters[universal]]
                    })
                } else if(universal === 'limit') {
                    universalLimit = formatSQL(limit, {
                        limit: res.locals.parsed.universalFilters[universal]
                    })
                } else if(universal === 'offset') {
                    universalOffset = formatSQL(offset, {
                        offset: res.locals.parsed.universalFilters[universal]
                    })
                }
            }
        } 

        universalFilterArray.push(universalSort, universalLimit, universalOffset);

        return universalFilterArray;
    }

    // GROUP BY
    // ==================================================
    function makeGroupByClause(allReturnableIDs, feature) {
        let groupByClause = '';

        // get all non-list returnables
        let nonListReturnables = allReturnableIDs.map(returnable => [returnable.ID, returnable.referenceType]).filter(returnable => !['obs-list', 'item-list', 'special'].includes(returnable[1]));
    
        // if there are list returnables group by the non-list returnables (so the list returnables can be aggregated over)
        if(nonListReturnables.length < allReturnableIDs.length) {
            groupByClause = formatSQL(groupBy, {
                nonListReturnables: nonListReturnables.map(el => `r${el[0]}`).join(', '),
                feature: feature
            })
        };

        

        return groupByClause;
    }
}

// SEND OBSERVATION DATA
// ============================================================
function sendDefault(req, res) {
    // This is row-major data

    /* DEBUG */
    //console.log(res.locals.parsed.finalQuery);
    

    // fuck .fill(), all my homies hate .fill()
    let rowData = Array(res.locals.parsed.finalQuery.rows.length).fill().map(e => [])

    let primaryKey = Array(res.locals.parsed.finalQuery.rows.length).fill().map(e => null)

    
    let keys = res.locals.parsed.finalQuery.fields.map(field => field.name);
    let returnableIDs = keys.filter(key => key !== 'obspkey').map(key => parseInt(key.slice(1)));

    // fill the rows
    keys.forEach((key, i) => {
        
        // handle primary keys
        if(key === 'obspkey') {
            res.locals.parsed.finalQuery.rows.forEach((row, ii) => {        
                primaryKey[ii] = row[key]
            })

        // if (list or special) and (array) then take distinct
        // This is because multiple many-to-manys duplicate the values in the other many-to-manys
        // kind of a hack but it works
        } else if(['obs-list', 'item-list', 'special'].includes(returnableIDLookup[returnableIDs[i-1]].referenceType) && res.locals.parsed.finalQuery.fields[i].dataTypeID == 1009) {
            res.locals.parsed.finalQuery.rows.forEach((row, ii) => {        
                rowData[ii].push([...new Set(row[key])]) 
            })

        } else {
            res.locals.parsed.finalQuery.rows.forEach((row, ii) => {        
                rowData[ii].push(row[key]) 
            })
        }  
    });

    if(res.locals.parsed.download.status) {
        if(res.locals.parsed.download.type == 'csv') {
            // add header
            let csvData = [['Observation Primary Key', ...returnableIDs]]
            // format rows with primary keys
            rowData.forEach((row, i) => row.unshift(primaryKey[i]))
            // add rows to csv
            rowData.forEach(row => csvData.push(row))
            
            // write to buffer and send
            writeToBuffer(csvData).then(data => {
                res.writeHead(200, {
                    'Content-Disposition': `attachment; filename="TDG-Download.csv"`,
                    'Content-Type': 'text/csv',
                })

                res.end(data)
            })
        } else if(res.locals.parsed.download.type == 'json') {
            res.writeHead(200, {
                'Content-Disposition': `attachment; filename="TDG-Download.json"`,
                'Content-Type': 'application/json',
            })

            res.end(JSON.stringify({
                returnableIDs,
                rowData,
                primaryKey
            }))
        } else {
            res.status(500).send('Download Parse Error')
        }
    } else {
        res.json({
            returnableIDs,
            rowData,
            primaryKey
        });
    }
};


// SEND OBSERVATION DATA
// ============================================================
function sendDistinct(req, res) {
    // This is column-major data

    let keys = res.locals.parsed.finalQuery.fields.map(field => field.name).filter(key => key !== 'obspkey');
    let returnableIDs = keys.map(key => parseInt(key.slice(1)));
    
    let columnData = Array(returnableIDs.length).fill().map(e => [])

    // fill the rows
    keys.forEach((key, i) => {
        
        // if (list or special) and (array) then take distinct
        // This is because multiple many-to-manys duplicate the values in the other many-to-manys
        // kind of a hack but it works
        if(['obs-list', 'item-list', 'special'].includes(returnableIDLookup[returnableIDs[i]].referenceType) && res.locals.parsed.finalQuery.fields[i+1].dataTypeID == 1009) {
            
            res.locals.parsed.finalQuery.rows.forEach(row => {        
                columnData[i].push([...new Set(row[key])]) 
            })
        } else {
            res.locals.parsed.finalQuery.rows.forEach(row => {            
                columnData[i].push(row[key]) 
            })
        }
    });

    // take distinct
    // if output is an array we have to use lodash to take the unique arrays
    columnData = columnData.map((row, i) => {
        if(['obs-list', 'item-list', 'special'].includes(returnableIDLookup[returnableIDs[i]].referenceType) && res.locals.parsed.finalQuery.fields[i+1].dataTypeID == 1009) {
            return lodashArray.uniqWith(row, lodashLang.isEqual)
        } else {
            return [...new Set(row)]
        }
    })

    res.json({
        returnableIDs,
        columnData
    })
}



// SEND STATS DATA
// ============================================================
async function statsQuery(req, res, next) {

    try { 

       //statsObservations
       //statsSubmitted
       //statsMostRecent
        
        let observations = await db.any('select max(observation_count_id) as obs from tdg_observation_count');  //maybe use a postgres var
        let submitted = await db.any('select max("s"."submission_id") as subs from item_submission as s');
        //let mostRecent = await db.one(statsMostRecent);

        let statsResponse = {
            observations: observations[0].obs,
            submitted: submitted[0].subs
        };

        return res.json(statsResponse);

    } catch(err) {

        console.log(err);
        res.status(500).send('Internal Server Error: 1703: Stats Query Error')

    }
    
}


// SEND SETUP OBJECT
// ============================================================
function sendSetup(req, res) {

    let cycleTime = Date.now() - res.locals.cycleTime[0]
    //console.log(`Sent setupObject in ${cycleTime} ms`)
    
    // if the "If-Modified-Since" header is not included or is newer or the same age as the setupObject's lastModified date
    if(res.locals.parsed.ifModifiedSince >= setupObject.lastModified) {

        return res.status(304) // don't send object - not modified
        
    } else { // then "If-Modified-Since" is older than setupObject's lastModified date or is something else

        // set "Last-Modified" header
        res.set('Last-Modified', setupObject.lastModified)
        // send setupObject
        return res.status(200).json(setupObject) // send setupObject
    };
};



module.exports = {
    featureQuery,
    statsQuery,
    cycleTime,
    sendDefault,
    sendDistinct,
    sendSetup
};