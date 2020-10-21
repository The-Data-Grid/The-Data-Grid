// LEGACY CODE //
// ============================================================
// This file is for legacy code that is no longer used. Although
// it is unlikely that it will be used in the future, it is best
// to not delete it for now. This file is never required by any
// other, so it will never be run.
// ============================================================


// Setup.js //
// ==================================================

//join SQL should equal query
            //select SQL --> tablename.columnname

            //// List ////

            // list_... -> list_m2m_... -> feature_...

            /*
            pgp.as.format('INNER JOIN $(listName:value)_m2m \
            ON $(listName:value)_m2m.observation_id = $(referenceTable:value).$(referenceColumn:value) \
            INNER JOIN $(listName:value) \
            ON $(listName:value).list_id = $(listName:value)_m2m.list_id', {myTable: 'feature_toilet', myTable2: 'sldkfjds'})

            //myTable, myTable2 will be interpolated using $()
            //second argument would be the row[]

            let listName= "listName_" + referenceTable + referenceColumn;

            if (table.includes("list_"))
            {
                let listJoin = {
                    feature: {
                        listName : { //Join m2m to audit table then join 
                            query: 'INNER JOIN $(listName:value)_m2m \
                                    ON $(listName:value)_m2m.observation_id = $(referenceTable:value).$(referenceColumn:value) \
                                    INNER JOIN $(listName:value) \
                                    ON $(listName:value).list_id = $(listName:value)_m2m.list_id',
                            dependencies: ['referenceTable']
                        }
                    }

                }
            }
            */
           //feature name, tablename, 
           //table name is c__table_name
           //featuer name is feature or f__table_name
           //many to many to the feature table and list table to many to many
           //list c__table_name

           //m2m table will just have _m2m at the end


// Query.js //
// ==================================================
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

/*
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
*/

// STATEMENT.JS //
// ==================================================


const commonJoin = { //JOINS THAT ARE SHARED BETWEEN FEATURES

    /***********************************
     ** LOCATION AND AUDIT SUBMISSION **
     ***********************************/
    
    // table joins for toilet location columns and toilet audit submission columns
    // Left join for room and regions (null in location tables)
    
    // loc
    loc : { // note: changed to inner join
        query: 'INNER JOIN loc ON $(feature:value).location_id = loc.location_id',
        dependencies: []
    },
    
    // room_number
    item_room : {
        query:'INNER JOIN item_room ON loc.room_id = item_room.room_id',
        dependencies: ['loc']
    },
    
    // building_name
    item_building : {
        query: 'INNER JOIN item_building ON item_room.building_id = item_building.building_id',
        dependencies: ['item_room', 'loc']
    },
    
    // building_community_name //CHANGE TO COMMUNITY ID
    item_community : {
        query: 'INNER JOIN item_community ON item_building.location_id = item_community.community_id',
        dependencies: ['item_building', 'item_room', 'loc']
    },
    
    // date_submitted -- unsure
    
    
    
    // sop_name
    item_sop : {
        query: 'INNER JOIN item_sop ON audit_submission.sop_id = item_sop.sop_id',
        //may need to change as it may not be referenced
        dependencies: ['tdg_submission']
    },
    
    // organization_name
    tdg_organization : {
        query: 'INNER JOIN tdg_organization ON audit_submission.organization_id = tdg_organization.organization_id',
        dependencies: ['tdg_submission']
    },
    
    // template_name
    tdg_template : {
        query: 'INNER JOIN tdg_template ON audit_submission.template_id = tdg_template.template_id',
        // query: 'INNER JOIN item_template ON audit_submission.organization_id = item_template.organization_id',
        dependencies: ['tdg_submission']
    }
    
    };
    
    const urinalJoin = { 
    /****************
     ** URINAL M2M **
     ****************/
     /*
    SELECT urinal_divider_condition.divider_condition_name, audit_urinal.gpf, audit_urinal.location_id, audit_urinal.time_conducted, audit_urinal.commentary
    FROM audit_urinal INNER JOIN urinal_divider_condition_m2m ON urinal_divider_condition_m2m.observation_id = audit_urinal.observation_id
    INNER JOIN urinal_divider_condition ON urinal_divider_condition.divider_condition_id = urinal_divider_condition_m2m.divider_condition_id;
    */
    urinal_divider_condition : {
        query: 'INNER JOIN urinal_divider_condition_m2m ON urinal_divider_condition_m2m.observation_id = audit_urinal.observation_id INNER JOIN urinal_divider_condition ON urinal_divider_condition.divider_condition_id = urinal_divider_condition_m2m.divider_condition_id',
        dependencies: []
    },
    
    urinal_flushometer_condition : {
        query: 'INNER JOIN urinal_flushometer_condition_m2m ON urinal_flushometer_condition_m2m.observation_id = audit_urinal.observation_id INNER JOIN urinal_flushometer_condition ON urinal_flushometer_condition_m2m.flushometer_condition_id = urinal_flushometer_condition.flushometer_condition_id',
        dependencies: []
    },
    
    urinal_sensor_condition : {
        query: 'INNER JOIN urinal_sensor_condition_m2m ON urinal_sensor_condition_m2m.observation_id = audit_urinal.observation_id INNER JOIN urinal_sensor_condition ON urinal_sensor_condition_m2m.sensor_condition_id = urinal_sensor_condition.sensor_condition_id',
        dependencies: []
    },
    
    urinal_flushometer_brand : {
        query: 'INNER JOIN urinal_flushometer_brand_m2m ON urinal_flushometer_brand_m2m.observation_id = audit_urinal.observation_id INNER JOIN urinal_flushometer_brand ON urinal_flushometer_brand_m2m.flushometer_brand_id = urinal_flushometer_brand.flushometer_brand_id',
        dependencies: []
    },
    
    urinal_basin_condition : {
        query: 'INNER JOIN urinal_basin_condition_m2m ON urinal_basin_condition_m2m.observation_id = audit_urinal.observation_id INNER JOIN urinal_basin_condition ON urinal_basin_condition_m2m.basin_condition_id = urinal_basin_condition.basin_condition_id',
        dependencies: []
    },
    
    urinal_basin_brand : {
        query: 'INNER JOIN urinal_basin_brand_m2m ON urinal_basin_brand_m2m.observation_id = audit_urinal.observation_id INNER JOIN urinal_basin_brand ON urinal_basin_brand_m2m.basin_brand_id = urinal_basin_brand.basin_brand_id',
        dependencies: []
    }
    
    };
    
    const toiletJoin = {
    /****************
     ** TOILET M2M **
     ****************/
    /*
    SELECT toilet_flushometer_brand.flushometer_brand_name, audit_toilet.gpf, audit_toilet.time_conducted, audit_toilet.commentary
    FROM audit_toilet INNER JOIN toilet_flushometer_brand_m2m ON audit_toilet.observation_id = toilet_flushometer_brand_m2m.observation_id
    INNER JOIN toilet_flushometer_brand ON toilet_flushometer_brand_m2m.flushometer_brand_id = toilet_flushometer_brand_m2m.flushometer_brand_id;
    */
    toilet_flushometer_brand : {
        query: 'INNER JOIN toilet_flushometer_brand_m2m ON audit_toilet.observation_id = toilet_flushometer_brand_m2m.observation_id INNER JOIN toilet_flushometer_brand ON toilet_flushometer_brand_m2m.flushometer_brand_id = toilet_flushometer_brand.flushometer_brand_id',
        dependencies: []
    },
    
    toilet_flushometer_condition : {
        query: 'INNER JOIN toilet_flushometer_condition_m2m ON audit_toilet.observation_id = toilet_flushometer_condition_m2m.observation_id INNER JOIN toilet_flushometer_condition ON toilet_flushometer_condition_m2m.flushometer_condition_id = toilet_flushometer_condition.flushometer_condition_id',
        dependencies: []
    },
    
    toilet_basin_condition : {
        query: 'INNER JOIN toilet_basin_condition_m2m ON audit_toilet.observation_id = toilet_basin_condition_m2m.observation_id INNER JOIN toilet_basin_condition ON toilet_basin_condition_m2m.basin_condition_id = toilet_basin_condition.basin_condition_id',
        dependencies: []
    },
    
    toilet_sensor_condition : {
        query: 'INNER JOIN toilet_sensor_condition_m2m ON audit_toilet.observation_id = toilet_sensor_condition_m2m.observation_id INNER JOIN toilet_sensor_condition ON toilet_sensor_condition_m2m.sensor_condition_id = toilet_sensor_condition.sensor_condition_id',
        dependencies: []
    },
    
    toilet_stall_condition : {
        query: 'INNER JOIN toilet_stall_condition_m2m ON audit_toilet.observation_id = toilet_stall_condition_m2m.observation_id INNER JOIN toilet_stall_condition ON toilet_stall_condition_m2m.stall_condition_id = toilet_stall_condition.stall_condition_id',
        dependencies: []
    },
    
    toilet_basin_brand : {
        query: 'INNER JOIN toilet_basin_brand_m2m ON audit_toilet.observation_id = toilet_basin_brand_m2m.observation_id INNER JOIN toilet_basin_brand ON toilet_basin_brand_m2m.basin_brand_id = toilet_basin_brand.basin_brand_id',
        dependencies: []
    }
    
    };
    
    const sinkJoin = {
    /**************
     ** SINK M2M **
     **************/
    sink_faucet_condition : {
        query: 'INNER JOIN sink_faucet_condition_m2m ON audit_sink.observation_id = sink_faucet_condition_m2m.observation_id INNER JOIN sink_faucet_condition ON sink_faucet_condition_m2m.faucet_condition_id = sink_faucet_condition.faucet_condition_id',
        dependencies: []
    },
    
    sink_faucet_brand : {
        query: 'INNER JOIN sink_faucet_brand_m2m ON audit_sink.observation_id = sink_faucet_brand_m2m.observation_id INNER JOIN sink_faucet_brand ON sink_faucet_brand_m2m.faucet_brand_id = sink_faucet_brand.faucet_brand_id',
        dependencies: []
    },
    
    sink_basin_condition : {
        query: 'INNER JOIN sink_basin_condition_m2m ON audit_sink.observation_id = sink_basin_condition_m2m.observation_id INNER JOIN sink_basin_condition ON sink_basin_condition_m2m.basin_condition_id = sink_basin_condition.basin_condition_id',
        dependencies: []
    },
    
    sink_basin_brand : {
        query: 'INNER JOIN sink_basin_brand_m2m ON audit_sink.observation_id = sink_basin_brand_m2m.observation_id INNER JOIN sink_basin_brand ON sink_basin_brand_m2m.basin_brand_id = sink_basin_brand.basin_brand_id',
        dependencies: []
    },
    
    sink_sensor_condition : {
        query: 'INNER JOIN sink_sensor_condition_m2m ON audit_sink.observation_id = sink_sensor_condition_m2m.observation_id INNER JOIN sink_sensor_condition ON sink_sensor_condition_m2m.sensor_condition_id = sink_sensor_condition.sensor_condition_id',
        dependencies: []
    }
    
    };
    
    const mirrorJoin = {
    /****************
     ** MIRROR M2M **
     ****************/
    mirror_condition : {
        query: 'INNER JOIN mirror_condition_m2m ON audit_mirror.observation_id = mirror_condition_m2m.observation_id INNER JOIN mirror_condition ON mirror_condition_m2m.mirror_condition_id = mirror_condition.mirror_condition_id',
        dependencies: []
    }
    
    }; 
    
    /***** END OF JOINS *****/
    
    
    /*let toiletLocations = {
        query: 'LEFT JOIN loc ON audit_toilet.location_id = loc.location_id\
        LEFT JOIN item_room ON loc.room_id = item_room.room_id\
        LEFT JOIN item_building on loc.location_id = item_building.location_id',
        dependencies: ['loc', 'item_room', 'item_building'],
    }
    
    let auditSubmission = {
        query: '"audit_submission" AS a_s OUTER JOIN "item_template" as i_t ON a_s.organization_id = i_t.organization_id) \
              OUTER JOIN "sop" as sop ON a_s.sop_id = sop.sop_id \
              OUTER JOIN "item_organization" as i_o ON a_s.organization_id = i_o.organization_id \
              OUTER JOIN "item_community" as i_c on i_o.community_id = i_c.community_id,',
        dependencies: ['audit_submission','item_template', 'sop', 'item_organization', 'item_community'],
    }
    */
    
    // Old Query Format
    
    /* 
    
    Commented out because it threw error at runtime. 
    
    let toiletFilter1 = { 
        type: 'toilet',
        query: 'WHERE $(columns)$(operator)$(value);',
        columns: ['gpf', 'commentary', 'date_conducted'],
        operator: ['=','>=']
    };
    
    let toiletPathFull = {
        type: 'toilet',
        query: 'SELECT a_t.gpf, a_t.commentary, a_t.date_conducted \
                FROM "audit_toilet" AS a_t \
                INNER JOIN "audit_submission" as a_s ON a_s.audit_id = a_t.audit_id \
                LEFT JOIN "loc" as loc ON a_t.location_id = loc.location_id;',
        columns: [a_t.gpf, a_t.commentary, a_t.date_conducted]
    }
    let auditSubmissionFilter = {
        type: 'audit',
        query: 'WHERE $(columns)$(operator)$(value);',
        columns: [a_s.date_submitted, a_s.template_id, a_s.sop_id, i_o.organization_name, i_c.community_name, i_c.city, i_c.state, i_c.country],
        operator: ['=','>=']
    }
    
    let auditSubmissionPath = {
        type: 'audit',
        query: 'SELECT a_s.date_submitted, a_s.template_id, a_s.sop_id, i_o.organization_name, i_c.community_name, i_c.city, i_c.state, i_c.country \
              FROM ("audit_submission" AS a_s OUTER JOIN "item_template" as i_t ON a_s.organization_id = i_t.organization_id) \
              OUTER JOIN "sop" as sop ON a_s.sop_id = sop.sop_id \
              OUTER JOIN "item_organization" as i_o ON a_s.organization_id = i_o.organization_id \
              OUTER JOIN "item_community" as i_c on i_o.community_id = i_c.community_id \
        ;',
        columns: [a_s.date_submitted, a_s.template_id, a_s.sop_id, i_o.organization_name, i_c.community_name, i_c.city, i_c.state, i_c.country]
    }
    */

    