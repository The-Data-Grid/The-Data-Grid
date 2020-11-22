//import * from './tdg_utils.mjs'
/*
// SETUP //
// ============================================================
const pgp = require("pg-promise")();
const cn = { // connection info
    host: 'localhost',
    port: 5432,
    database: 'meta',
    user: 'postgres',
    password: null,
    max: 5 // use up to 5 connections
};

// db.function is used for pg-promise queries
const db = pgp(cn);

// SQL and SQL-generating functions //

const queryColumnNameSQL =
	'SELECT column_name FROM metadata_column WHERE column_id=$(columnID)'

const insertAuditSQL =
  'INSERT INTO tdg_audit \
    (audit_id, catalog_id, user_id, data_time_created, data_audit_name) \
    VALUES (DEFAULT, $(catalogID), $(userID), $(timeCreated), $(auditName))'

const insertSubmissionSQL =
  'INSERT INTO tdg_submission \
    (submission_id, audit_id, user_id, data_time_submitted, data_submission_name) \
    VALUES (DEFAULT, $(auditID), $(userID), $(timeSubmitted), $(submissionName))'

function insertFeatureSQL (tableName, itemSQL, dataColNames, dataValStrings) {
	statement = 'INSERT INTO ' + tableName + ' (observation_id, observation_count_id, submission_id, featureitem_id, \
		data_time_conducted, data_auditor, data_commentary, '
	statement += dataColNames.join(', ')
	statement += ') VALUES (DEFAULT, \
		(INSERT INTO tdg_observation_count VALUES (DEFAULT) RETURNING observation_count_id), currval(\'tdg_submission_submission_id_seq\'), '
	statement += '(' + itemSQL + '), $(timeConducted), $(auditor), $(commentary), '
	// TODO: make sure dataValStrings are perfectly formatted
	statement += dataValStrings.join(', ')
	statement += ')'
	return statement
}

// Given colNames list e.g. ['uzee', 'quaker', 'aight'] and
// colVals list e.g. [1, 4, 'poo'] and operator string e.g. '='
// returns string "uzee=1 AND quaker=4.3 AND aight='poo'" 

function conditionListSQL (colNames, colVals, operator = '=') {
	let conditionList = []
	colNames.forEach((colName, idx) => {
		let colVal = pgp.as.format('$(val)', {val: colVals[idx]})
		conditionList.push(colName + operator + colVal)
	})
	return conditionList.join(' AND ')
}

// Example:
// WITH new_id AS
// (INSERT INTO item_toilet (item_id, data_clockwise_number, item_room_id) VALUES
// (DEFAULT, 4, (SELECT item_id FROM item_room WHERE data_room_number=2200
// and item_building_id=(SELECT item_id FROM item_building WHERE data_building_name='Young Hall')))
// ON CONFLICT (data_clockwise_number, item_room_id) DO NOTHING RETURNING item_id)
// SELECT item_id FROM new_id UNION (SELECT item_id FROM item_toilet WHERE
// item_room_id=(SELECT item_id FROM item_room WHERE data_room_number=2200
// and item_building_id=(SELECT item_id FROM item_building WHERE data_building_name='Young Hall')));

// Assume itemIdColNames are exactly the ID columns for that item table

function insertItemSQL (tableName, itemIdColNames, itemIdColVals) {
	statement = 'WITH new_id as ('
	statement += 'INSERT INTO ' + tableName + ' (item_id, '
	statement += itemIdColNames.join(', ')
	statement += ') VALUES (DEFAULT, '
	statement += itemIdColVals.join(', ')
	statement += ') ON CONFLICT ('
	statement += itemIdColNames.join(', ')
	statement += ') DO NOTHING RETURNING item_id'
	statement += ') SELECT item_id FROM new_id UNION '
	statement += '(SELECT item_id FROM ' + tableName + ' WHERE '
	statement += conditionListSQL(itemIdColNames, itemIdColVals, '=')
	statement += ')'
	return statement
}

// General utility functions based on TDG-specific nomenclature

function featureNameToFeatureTableName (featureName) {
	return 'feature_' + featureName.toLowerCase()
}

function featureNameToItemTableName (featureName) {
	return 'item_' + featureName.toLowerCase()
}

// FUNCTIONS //

// ============================================================
// getColumnName (columnID)
// ============================================================
// Queries database for column name corresponding to a
// column ID (primary key of metadata_column)
// Necessary because can't do subquery..?
// ============================================================

async function getColumnName (columnID) {	
	colNameObj = await db.one(pgp.as.format(queryColumnNameSQL, {columnID: columnID}))
	return colNameObj['column_name']
}

// ============================================================
// getUserID()
// ============================================================
// Gets user ID (primary key in tdg_users) corresponding to
// token of the user trying to modify the database
// ============================================================

function getUserID() {
  return 0 // dummy for now TODO
}

// ============================================================
// createDefaultAuditName(sqlTimestamp)
// ============================================================
// Takes in SQL timestamptz string of the format
//                  YYYY-MM-DD hh:mm:ss-07
// and returns string "Audit created YYYY/MM/DD hh:mm:ss"
// ============================================================

function createDefaultAuditName (sqlTimestamp) {
  return "Audit created " + sqlTimestamp.slice(0, -3)
}

// ============================================================
// createDefaultSubmissionName(sqlTimestamp)
// ============================================================
// Takes in SQL timestamptz string of the format
//                  YYYY-MM-DD hh:mm:ss-07
// and returns string "Submission created YYYY-MM-DD hh:mm:ss"
// ============================================================

function createDefaultSubmissionName (sqlTimestamp) {
  return "Submission created " + sqlTimestamp.slice(0, -3)
}

// ============================================================
// insertAudit (auditInput)
// ============================================================
// Takes an auditInput object and returns SQL statement
// singleton inserting appropriate row into tdg_audit table
// ============================================================

function insertAudit (auditInput) {
  	
	let sqlList = []
	
	// Validate if catalogID exists TODO
  // Validate if userID exists TODO
	
  sqlList.push(pgp.as.format(insertAuditSQL, {
    catalogID:    (auditInput.catalogID === null ?
                   'null' : auditInput.catalogID),
    userID:       getUserID(), // dummy TODO
    timeCreated:  auditInput.timeCreated, // may need to do extra formatting TODO
    auditName:    (auditInput.auditName === null ?
                  createDefaultAuditName(auditInput.timeCreated)
									: auditInput.auditName),
  }))
	
	return sqlList
}

// ============================================================
// insertSubmission (submissionInput)
// ============================================================
// Takes a submissionInput object and returns sqlList,
// list of SQL statements that inserts row into tdg_submission
// as well as all associated feature observation rows
// and item, m2m entries
// ============================================================

async function insertSubmission (submissionInput) {
	
	let sqlList = []
	
	// Validate if userID exists TODO
	
	// Add row to submission table
	sqlList.push(pgp.as.format(insertSubmissionSQL, {
    auditID:				submissionInput.auditID,
		userID:					getUserID(), // dummy TODO
		timeSubmitted:	submissionInput.timeSubmitted,
		submissionName: (submissionInput.submissionName === null ?
										 createDefaultSubmissionName(submissionInput.timeSubmitted)
										 : submissionInput.submissionName),
  }))
	
	// Loop over all feature observations
	for (let featureInput of submissionInput.featureInputs) {
		sqlList.push(insertFeature(featureInput))
	}
	
	return sqlList
}

// ============================================================
// insertFeature (featureInput)
// ============================================================
// Takes a featureInput object and returns SQL statement
// singleton that inserts the feature observation
// and also inserts item if it does not already exist
// ============================================================

async function insertFeature (featureInput) {
	
	let sqlList = []
	
	let featureName = featureInput.featureName
	let featureItem = featureInput.featureItem	
	let dataColumnNames = await Promise.all(featureInput.columnIDs.map(cid => getColumnName(cid)))
	let dataColumnValues = featureInput.columnData // TODO
	let tableName = featureNameToFeatureTableName(featureName)
	let itemSQL = await insertItem (featureName, featureItem)
	
	let thisFeatureSQL = insertFeatureSQL(tableName, itemSQL, dataColumnNames, dataColumnValues)
	
	sqlList.push(pgp.as.format(thisFeatureSQL, {
			timeConducted:	featureInput.timeConducted,
			commentary:			featureInput.commentary,
			auditor:				featureInput.auditor,
		}))
	
	return sqlList
}

// ============================================================
// insertItem (itemInput)
// ============================================================
// Takes an itemInput object and returns SQL statement
// singleton that inserts the item into proper feature item
// table, if it doesn't already exist, and returns the item ID
// ============================================================

async function insertItem (featureName, itemInput) {
	
	let sqlList = []	
	
	let itemIdColNames = await Promise.all(itemInput.columnIDs.map(cid => getColumnName(cid)))
	let itemIdColVals = itemInput.columnData // TODO
	let tableName = featureNameToItemTableName(featureName)
	sqlList.push(insertItemSQL(tableName, itemIdColNames, itemIdColVals))
	
	return sqlList
}

// ============================================================
// editSubmission (editSubmissionInput)
// ============================================================
// Takes an editSubmissionInput object and returns sqlList,
// list of SQL statements that edit/delete the appropriate
// feature observations in an existing submission
// ============================================================

function editSubmission (editSubmissionInput) {
	
	let sqlList = []
	// TODO
	sqlList.push(pgp.as.format({}))
}







// old stuff for reference below

async function asyncConstructAuditingTables(featureSchema, columnSchema) {

    console.log("Generating SQL...")

    // Step 1.
    // Insert features into metadata_feature,
    //     create feature_..., subfeature_..., and item_... tables (auditing tables)
    let {fCreateList, fRefList, fMetadataList} = constructFeatures(featureSchema);
    let featureCreateInsert = [...fCreateList, ...fMetadataList].map((sql) => db.none(sql));
    
    await Promise.all(featureCreateInsert)
    
    console.log("Feature Insert and Create Done...") 
    console.log("Generating SQL...")

    // Step 2.
    // Add foreign key constraints for auditing tables
    let featureRelation = fRefList.map((sql) => db.none(sql))

    await Promise.all(featureRelation)

    console.log("Feature Foreign Key Constraints Done...")
    console.log("Generating SQL...")

    // Step 3.
    // Insert columns into metadata_column and add data_... columns
    let {cCreateList, cRefList, cMetadataList} = addDataColumns(columnSchema, featureSchema);
    // console.log(cMetadataList)
    let columnCreateInsert = [...cCreateList, ...cMetadataList].map((sql) => db.none(sql));

    await Promise.all(columnCreateInsert)

    console.log("Column Insert and Create Done...")
    console.log("Generating SQL...")

    // Step 4.
    // Add foreign key constraints for data_... columns
    let columnRelation = cRefList.map((sql) => db.none(sql))
    
    await Promise.all(columnRelation)

    console.log("Column Foreign Key Constraints Done...")

    // Closing the database connection
    db.$pool.end();

    // Done!
    
    console.log('\x1b[47m\x1b[2m\x1b[34m%s\x1b[0m', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('\x1b[47m\x1b[2m\x1b[34m%s\x1b[0m', '                             ');
    console.log('\x1b[47m\x1b[1m\x1b[32m%s\x1b[0m', '   Successful Construction   ');
    console.log('\x1b[47m\x1b[2m\x1b[34m%s\x1b[0m', '                             ');
    console.log('\x1b[47m\x1b[2m\x1b[34m%s\x1b[0m', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('\x1b[47m\x1b[2m\x1b[30m%s\x1b[0m', ' Long live the power source! ');
}

// Helper Functions //
function sqlDateConverter(date) { //converts MM-DD-YYYY to SQL preferred YYYY-MM-DD
    date = date.split('-');
    return [date[2],date[0],date[1]].join('-');
}

// Prepared Statements //
const insert_audit_submission = new PS({
    name: 'audit_submission',
    text: 'INSERT INTO audit_submission ($/columns:csv/) VALUES ($/values:csv/) RETURNING audit_id',
});

const insert_audit_toilet = new PS({
    name: 'audit_toilet',
    text: 'INSERT INTO audit_toilet ($/columns/) VALUES ($/values/) RETURNING observation_id'
});

const check_community_id = new PS({
    name: 'item_community_id',
    text: 'SELECT "community_id" FROM "item_community" WHERE "community_name" = $/c_name/'
});

const check_building_id = new PS({
    name: 'item_building_id',
    text: 'SELECT "building_id" FROM "item_building" WHERE "building_name" = %/b_name/ AND "community_id" = $/c_id/'
});

const check_room_id = new PS({
    name: 'item_room_id',
    text: 'SELECT "room_id" FROM "item_room" WHERE "building_id" = $/b_id/ AND "room_number" = $/r_num/'
});

const insert_room = new PS({
    name: 'item_room',
    text: 'INSERT INTO item_room(room_id, room_number, building_id) VALUES(DEFAULT,$/r_num/,$/b_id/) RETURNING room_id'
});

const check_location_id = new PS({
    name: 'loc_location_id',
    text: 'SELECT "location_id" FROM "loc" WHERE $/loc_type/ = $/loc_id/'
});

const insert_location = new PS({
    name: 'item_location',
    text: 'INSERT INTO loc(location_id, $/loc_type/) VALUES(DEFAULT, $/loc_id/) RETURNING location_id'
});

const check_point_id = new PS({
    name: 'item_point_id',
    text: 'SELECT "point_id" FROM "item_point" WHERE "longitude" = $/long/ AND "latitude" = $/lat/'
});

const insert_point_id = new PS({
    name: 'item_point',
    text: 'INSERT INTO item_point(point_id, longitude, latitude) VALUES(DEFUALT, $/long/, $/lat/) RETURNING point_id'
});

const check_geom_region_id = new PS({
    name: 'item_geom_region_id',
    text: 'SELECT "geom_region_id" FROM "item_geom_region" WHERE "region" = $/region/'
});

const insert_geom_region = new PS({
    name: 'item_geom_region',
    text: 'INSERT INTO item_geom_region(geom_region_id, region) VALUES(DEFAULT, $/region/) RETURNING geom_region_id'
});


// Formatting Classes //
class insertToilet { //Formats Toilet Data
    constructor() {

    };
};

class insertAuditClass { //formats Audit Submission data
    constructor(obj) {
        this.columns = obj;
        this.default = {
            columns: ['audit_id', 'time_submitted'],
            values: ['DEFAULT', 'NOW()']
        }
    };
    insert() {
        let out = {
            columns: Object.keys(this.columns),
            values: Object.values(this.columns)
        }
        this.default.columns.forEach(element => {out.columns.push(element)});
        this.default.values.forEach(element => {out.values.push(element)});
        return out;
    };
};

// Formatting //

function formatAudit(input) { 
    let data = {}
    data.audit = new insertAuditClass(input.auditSubmission).insert()
    return data
}


// pg-promise //

// community and building must return one row, meaning that the community and building referenced in an audit must already 
// exist as an item when uploading. The room and location however, do not need to exist, so referencing a room new number or new location in an audit creates
// a new item_room with that room number in the database

function insertAudit(req, res) {

    // Formatting upload
    let data = formatAudit(res.locals.parsed);

    db.tx(async t => { 
        // Audit Submission
        const audit_id = await t.one(insert_audit_submission, data.audit); 
        // Location
        if(data.location_type == 'room') { //dealing with room/building location
            const loc_type = 'room_id';
            const community_id = await t.one(check_community_id); //community must exist
            const building_id = await t.one(check_building_id); //building must exist
            const loc_id = await t.oneOrNone(check_room_id); //create new room if one doesn't exist
            if(!loc_id) {
                const loc_id = await t.one(insert_room);
            };
        } else if(data.location_type == 'point') {
            const loc_type = 'point_id';
            const loc_id = await t.oneOrNone(check_point_id); //create new point if one doesn't exist
            if(!loc_id) {
                const loc_id = await t.one(insert_point_id);
            };
        } else if(data.location_type == 'geom_region') {
            const loc_type = 'geom_region_id';
            const loc_id = await t.oneOrNone(check_geom_region_id); //create new geom region if one doesn't exist
            if(!loc_id) {
                const loc_id = await t.one(insert_geom_region)
            };
        };
        const location_id = await t.oneOrNone(check_location_id);
        if(!location_id) {
            const location_id = await t.one(insert_location);
        };
        // Many to Many

        // Feature Table 
    });
    // IF SUCCESS
    res.json({'status': 'OK'})
    // IF FAILED
    res.json({'status': errorCode})
}





    






function makeInsert(input) {
    for(let table in input) {

    }
}







// SAMPLE INPUT. THE INPUT WILL BE IN THIS FORMAT //
// The input will actually probably not in this format. It will likely 
// be in the new compact response object format described in the API

let input = {
    toilet: [
        {
            gpf: 8, commentary: 'nice toilet', date_conducted: '02-23-2010',
            flushometer_condition_name: 'good', flushometer_brand_name: 'generic',
            basin_condition_name: 'good', basin_brand_name: 'generic',
            stall_condition_name: 'good', sensor_condition_name: 'good',
            room_number: 2000, building_name: 'Boelter Hall',
            building_community_name: 'UCLA', location_type: 'room'
        }
    ],
    auditSubmission: {
        template_id: '7', sop_id: '2', organization_id: '1'
    }
}



module.exports = { //exporting data and item insertion
    insertAudit
}

*/

// trash
// with new_id as (insert into item_blah values (default, 1, 2) on conflict (data_clockwise_number, data_another_number) do nothing returning item_id) select * from new_id union (select item_id from item_blah where data_clockwise_number=1 and data_another_number=2);
// WITH new_id as (INSERT INTO item_blah (item_id, data_clockwise_number, data_another_number) VALUES (DEFAULT, 2, 2) ON CONFLICT (data_clockwise_number, data_another_number) DO NOTHING RETURNING item_id) SELECT item_id FROM new_id UNION (SELECT item_id FROM item_blah WHERE data_clockwise_number=2 AND data_another_number=2);