// ============================================================
// This script constructs feature/subfeature tables
// and simultaneously inserts relevant metadata.
//
// TODO: referencing items that were specified
//       everything inside a transaction?
//
//       switch additionalCol into data and item
//       because we need to differentiate item
//       for item referencing 
// ============================================================

// SETUP //
// ============================================================
const pgp = require("pg-promise")();
const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'meta',
    user: 'postgres',
    password: null,
    max: 5 // use up to 5 connections
};

//db.function is used for pg-promise queries
const db = pgp(cn);

// Import Schema //
// ==================================================

var fs = require('fs'); // Import Node.js File System

function readSchema(file) { // Schema read function
    return JSON.parse(fs.readFileSync(__dirname + file, 'utf8'))
}

// SQL //
// ============================================================

// newCreateList: SQL for creating a new list_m2m table

const newCreateListm2m = 'CREATE TABLE $(tableName:value) (\
    observation_id INTEGER NOT NULL,\
    list_id INTEGER NOT NULL)'

// newCreateList: SQL for creating a new list table

const newCreateList = 'CREATE TABLE $(tableName:value) (\
    list_id SERIAL PRIMARY KEY,\
    $(columnName:value) $(sqlDatatype:value) NOT NULL)'

// newAddColumn: SQL for adding a column to an existing table

const newAddColumn = 'ALTER TABLE $(tableName:value) ADD COLUMN $(columnName:value) $(sqlDatatype:value) $(nullable:value)'

// reference: SQL for making one column reference another

var reference = 'ALTER TABLE $(fkTable:value) \
                  ADD FOREIGN KEY ($(fkCol:value)) \
                  REFERENCES $(pkTable:value) ($(pkCol:value))';

// newCreateFeature: SQL for creating new feature table

var newCreateFeature = 
        'CREATE TABLE $(feature:value) (\
            observation_id SERIAL PRIMARY KEY,\
            observation_count_id INTEGER NOT NULL, \
            submission_id INTEGER NOT NULL,\
            featureitem_id INTEGER NOT NULL)'

// newCreateSubfeature: SQL for creating new subfeature table

var newCreateSubfeature = {
    withFeatureItem: 'CREATE TABLE $(feature:value) (\
        parent_id INTEGER NOT NULL, \
        observation_id SERIAL PRIMARY KEY,\
        observation_count_id INTEGER NOT NULL, \
        featureitem_id INTEGER NOT NULL)',
    withoutFeatureItem: 'CREATE TABLE $(feature:value) (\
        parent_id INTEGER NOT NULL, \
        observation_id SERIAL PRIMARY KEY,\
        observation_count_id INTEGER NOT NULL)'
};

// newCreateFeatureItem: SQL for creating new feature item table

var newCreateFeatureItem = 
        'CREATE TABLE $(feature:value) ( \
            item_id SERIAL PRIMARY KEY, \
            $(location:value) INTEGER NOT NULL)';

// newMetadataFeature: SQL for inserting one row to
// the metadata_feature table, representing a feature (which has no parent)

var newMetadataFeature =
				'INSERT INTO metadata_feature \
					(feature_id, table_name, parent_id, num_feature_range, information, frontend_name) \
					VALUES \
					(DEFAULT, $(tableName), \
					null, \
					$(numFeatureRange), \
					$(information), \
					$(frontendName));'

// newMetadataSubfeature: SQL for inserting one row to
// the metadata_feature table, representing a subfeature (which has a parent)

var newMetadataSubfeature =
				'INSERT INTO metadata_feature \
					(feature_id, table_name, parent_id, num_feature_range, information, frontend_name) \
					VALUES \
					(DEFAULT, $(tableName), \
					(SELECT feature_id FROM metadata_feature WHERE table_name = $(parentTableName)), \
					$(numFeatureRange), \
					$(information), \
					$(frontendName));'

// select[X]ID: SQL to get ID corresponding to non-null name

var selectFeatureID = '(SELECT feature_id from metadata_feature WHERE table_name = $(featureName:value))'
var selectSelectorID = '(SELECT selector_id from metadata_selector WHERE selector_name = $(selectorName:value))'
var selectSqlTypeID = '(SELECT type_id from metadata_sql_type WHERE type_name = $(sqlDatatype:value))'
var selectRefTypeID = '(SELECT type_id from metadata_reference_type WHERE type_name = $(referenceDatatype:value))'
var selectFrontendTypeID = '(SELECT type_id from metadata_frontend_type WHERE type_name = $(frontendDatatype:value))'

var initialSelectStatment = {
    newSelectFeatureID: 'SELECT feature_id, table_name from metadata_feature',
    newSelectSelectorID: 'SELECT selector_id, selector_name from metadata_selector',
    newSelectSqlTypeID: 'SELECT type_id, type_name from metadata_sql_type',
    newSelectRefTypeID: 'SELECT type_id, type_name from metadata_reference_type',
    newSelectFrontendTypeID: 'SELECT type_id, type_name from metadata_frontend_type'
}

// newMetadataColumn: SQL for inserting one row to the metadata_column
// table, representing a feature-associated or global data column

var newMetadataColumn =
'INSERT INTO metadata_column \
(column_id, feature_id, rootfeature_id, frontend_name, column_name, table_name, reference_column_name, reference_table_name, information, filter_selector, input_selector, sql_type, reference_type, frontend_type, is_nullable, is_default, is_global, is_ground_truth) \
VALUES \
(DEFAULT, \
(SELECT feature_id from metadata_feature WHERE table_name = $(featureName)), \
(SELECT feature_id from metadata_feature WHERE table_name = $(rootFeatureName)), \
$(frontendName), \
$(columnName), \
$(tableName), \
$(referenceColumnName:json), \
$(referenceTableName:json), \
$(information), \
(SELECT selector_id from metadata_selector WHERE selector_name = $(filterSelectorName)), \
(SELECT selector_id from metadata_selector WHERE selector_name = $(inputSelectorName)), \
(SELECT type_id from metadata_sql_type WHERE type_name = $(sqlDatatype)), \
(SELECT type_id from metadata_reference_type WHERE type_name = $(referenceDatatype)), \
(SELECT type_id from metadata_frontend_type WHERE type_name = $(frontendDatatype)), \
$(nullable), $(default), $(global), $(groundTruthLocation))'

const checkAuditorNameTrigger = "CREATE TRIGGER $(tableName:value)_check_auditor_name BEFORE INSERT OR UPDATE ON $(tableName:value) \
FOR EACH ROW EXECUTE FUNCTION check_auditor_name();"

// Water //
// ==================================================

var auditSchemaWaterDynamic = readSchema('/auditSchema/water/waterDynamic.json');
var auditSchemaWaterFeature = readSchema('/auditSchema/water/waterFeature.json');
var auditSchemaGlobal = readSchema('/auditSchema/global/globalColumns.json');


// CALLING //
// ============================================================
/*
1. Insert features into metadata_feature,
    create feature_..., subfeature_..., and item_... tables (auditing tables)
2. Add foreign key constraints for auditing tables
3. Insert columns into metadata_column and add data_... columns
4. Add foreign key constraints for data_... columns
5. Add local-global and special columns into metadata_column for every feature
*/
// ============================================================

//                                    (featureSchema, columnSchema)
asyncConstructAuditingTables(auditSchemaWaterFeature, [...auditSchemaWaterDynamic, ...auditSchemaGlobal])

// FUNCTIONS //

// ============================================================
// asyncConstructAuditingTables (featureSchema, columnSchema)
// ============================================================
// Takes a list of metadataFeatureInput objects (featureSchema)
// and list of metadataColumnInput objects (columnSchema)
// to execute all SQL statements to construct relevant tables
// ============================================================

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
    console.log(cMetadataList)
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
    /*
        let createList = addDataColumns(columnSchema).createList;
                                        
        console.log('aa')
                                            
        let refList = [...constructFeatures(featureSchema).refList,
                                            ...addDataColumns(columnSchema).refList];
                                            
        let metadataList = [...constructFeatures(featureSchema).metadataList, 
                                            ...addDataColumns(columnSchema).metadataList];

        


        console.log("Creating tables...")
            
            // Array of insert metadata queries
            let metadataQueries = [];
            for (let metadata of metadataList) {
                    console.log(metadata)
                    metadataQueries.push(db.none(metadata)) }
            
            Promise.all(metadataQueries).then( () => {
                    console.log("Done inserting metadata!") } )

        // Array of create table queries
        let createQueries = [];
        for (let create of createList) {
            createQueries.push(db.none(create)) }

        Promise.all(createQueries).then( () => {
                    console.log("Done creating feature tables!")
            console.log("Setting up Foreign Key Constraints...")

            // Array of foreign key constrant queries
            let refQueries = [];
            for(let ref of refList) {
                refQueries.push(db.none(ref))
            }

            Promise.all(refQueries).then( () => {
                console.log("Done!")

                // Closing the database connection
                db.$pool.end();
            })
            
        });
    })


    */
};

// ============================================================
// constructFeatures (features)
// ============================================================
// Takes a list of metadataFeatureInput objects
// and returns an object of the form
// 	{createList:	 [list of SQL create statements],
// 	 refList:			 [list of SQL ref statements],
//   metadataList: [list of SQL metadata insert statements]}
// ============================================================

function constructFeatures(features) {
		
	let metadataList = [];
    let createList = [];
    let refList = [];

    /* TODO: add validation so subfeature with nonexistent parent cannot be created */

    //For every feature/subfeature
    features.forEach((element, index) => {
        
        // if root feature
        if (element.parentTableName === null) {
            
						// add metadata_feature entry
						metadataList.push(pgp.as.format(newMetadataFeature, {
                                tableName: element.tableName,
								numFeatureRange: (element.numFeatureRange === null ?
																	null : element.numFeatureRange),
								information: element.information,
								frontendName: element.frontendName
            }));


            // add create feature table to stack
            createList.push(pgp.as.format(newCreateFeature, {
                feature: element.tableName
            }));

            // add feature to submission reference to stack
             refList.push(pgp.as.format(reference, {
                pkCol: 'submission_id',
                pkTable: 'tdg_submission',
                fkCol: 'submission_id',
                fkTable: element.tableName
            }));
            
            // add feature to observation count reference to stack
            refList.push(pgp.as.format(reference, {
                pkCol: 'observation_count_id' ,
                pkTable: 'tdg_observation_count',
                fkCol: 'observation_count_id',
                fkTable: element.tableName
            }));

            // If room or building we need to do something else because these items already exist
            if(['item_room', 'item_building'].includes(element.tableName.replace('feature_', 'item_'))) {

                // add feature to feature item reference to stack
                refList.push(pgp.as.format(reference, {
                    pkCol: 'item_id',
                    pkTable: element.tableName.replace('feature_', 'item_'),
                    fkCol: 'featureitem_id',
                    fkTable: element.tableName
                }));

            } else {

                // add create feature item to stack
                createList.push(pgp.as.format(newCreateFeatureItem, {
                    feature: element.tableName.replace('feature_', 'item_'),
                    location: element.location + '_id'  
                }));

                // add feature to feature item reference to stack
                refList.push(pgp.as.format(reference, {
                    pkCol: 'item_id',
                    pkTable: element.tableName.replace('feature_', 'item_'),
                    fkCol: 'featureitem_id',
                    fkTable: element.tableName
                }));

                // add feature item to location reference to stack
                if(['item_room', 'item_building'].includes(element.location)) {
                    refList.push(pgp.as.format(reference, {
                        pkCol: 'item_id',
                        pkTable: element.location,
                        fkCol: element.location + '_id' ,
                        fkTable: element.tableName.replace('feature_', 'item_')
                    }));
                } else {
                    refList.push(pgp.as.format(reference, {
                        pkCol: 'location_id',
                        pkTable: element.location,
                        fkCol: element.location + '_id' ,
                        fkTable: element.tableName.replace('feature_', 'item_')
                    }));
                }
                
            }

        } else { // then a subfeature
						
						// add metadata_feature entry
						metadataList.push(pgp.as.format(newMetadataSubfeature, {
                                tableName: element.tableName,
								parentTableName: element.parentTableName,
								numFeatureRange: (element.numFeatureRange === null ?
																	null : element.numFeatureRange),
								information: element.information,
								frontendName: element.frontendName
            }));

            // if no feature item
            if(element.location === null) {

                // add create subfeature to stack
                createList.push(pgp.as.format(newCreateSubfeature.withoutFeatureItem, {
                    feature: element.tableName
                }));

            } else { // then featureitem
                
                // add create subfeature to stack
                createList.push(pgp.as.format(newCreateSubfeature.withFeatureItem, {
                    feature: element.tableName
                }));

                // add create feature item to stack
                createList.push(pgp.as.format(newCreateFeatureItem, {
                    feature: element.tableName.replace('subfeature_', 'item_'),
                    location: element.location + '_id'  
                }));

                // add subfeature to feature item reference to stack
                refList.push(pgp.as.format(reference, {
                    pkCol : 'featureitem_id',
                    pkTable: element.tableName,
                    fkCol: 'item_id',
                    fkTable: element.tableName.replace('subfeature_', 'item_')
                }))

                // add feature item to location reference to stack
                if(['item_room', 'item_building'].includes(element.location)) {
                    refList.push(pgp.as.format(reference, {
                        pkCol: 'item_id',
                        pkTable: element.location,
                        fkCol: element.location + '_id' ,
                        fkTable: element.tableName.replace('feature_', 'item_')
                    }));
                } else {
                    refList.push(pgp.as.format(reference, {
                        pkCol: 'location_id',
                        pkTable: element.location,
                        fkCol: element.location + '_id' ,
                        fkTable: element.tableName.replace('feature_', 'item_')
                    }));
                }

            }

            // add subfeature to observation count reference to stack
            refList.push(pgp.as.format(reference, {
                pkCol: 'observation_count_id' ,
                pkTable: 'tdg_observation_count',
                fkCol: 'observation_count_id',
                fkTable: element.tableName
            }));
        }
    })

    return {fCreateList: createList, fRefList: refList, fMetadataList: metadataList}
}

// ============================================================
// addDataColumns (columns)
// ============================================================
// Takes a list of metadataColumnInput objects
// and returns an object of the form
// 	{createList:	 [list of SQL create statements],
// 	 refList:			 [list of SQL ref statements],
//   metadataList: [list of SQL metadata insert statements]}
// ============================================================

function addDataColumns(columns, features) {

    let createList = [];
    let refList = [];
	let metadataList = [];

    columns.forEach( column => {

        // INSERTING INTO METADATA_COLUMN //

        if (column.referenceDatatype != 'local-global' && column.referenceDatatype != 'special') {

            // Insert metadata_column entry for all non-globals (except submission)
            metadataList.push(pgp.as.format(newMetadataColumn, {
                featureName: column.featureName,
                rootFeatureName: column.rootFeatureName,
                frontendName: column.frontendName,
                columnName: column.columnName,
                tableName: column.tableName,
                referenceColumnName: column.referenceColumnName,
                referenceTableName: column.referenceTableName,
                information: column.information,
                filterSelectorName: column.filterSelectorName,
                inputSelectorName: column.inputSelectorName,
                sqlDatatype: column.sqlDatatype,
                referenceDatatype: column.referenceDatatype,
                frontendDatatype: column.frontendDatatype,
                nullable: column.nullable,
                default: column.default,
                global: column.global,
                groundTruthLocation: column.groundTruthLocation
            }))

        } else {

            // Insert metadata_column entry for local-global and special FOR EVERY FEATURE
            // Note: It's done this way because these are the same for every feature, and thus
            //       are in globalColumns.json once, but must be included in metadata_column
            //       for every feature

            for(feature of features) {

                metadataList.push(pgp.as.format(newMetadataColumn, {
                    featureName: feature,
                    rootFeatureName: null,
                    frontendName: column.frontendName,
                    columnName: column.columnName,
                    tableName: feature.tableName,
                    referenceColumnName: column.referenceColumnName,
                    referenceTableName: column.referenceTableName,
                    information: column.information,
                    filterSelectorName: column.filterSelectorName,
                    inputSelectorName: column.inputSelectorName,
                    sqlDatatype: column.sqlDatatype,
                    referenceDatatype: column.referenceDatatype,
                    frontendDatatype: column.frontendDatatype,
                    nullable: column.nullable,
                    default: column.default,
                    global: column.global,
                    groundTruthLocation: column.groundTruthLocation
                }))
            }
            
        }

        // CREATING LISTS, DATA_... COLUMNS, AND REFERENCES //
				
        if (column.referenceDatatype == 'list') {

            // Create List table
            createList.push(pgp.as.format(newCreateList, {
                tableName: column.tableName,
                columnName: column.columnName,
                sqlDatatype: column.sqlDatatype
            }))

            // Create List Many to Many
            createList.push(pgp.as.format(newCreateListm2m, {
                tableName: column.tableName.replace('list_', 'list_m2m_')
            }))

            // Create m2m to List reference
            refList.push(pgp.as.format(reference, {
                pkCol: 'list_id',
                pkTable: column.tableName,
                fkCol: 'list_id',
                fkTable: column.tableName.replace('list_', 'list_m2m_')
            }))

            // Create m2m to feature reference
            refList.push(pgp.as.format(reference, {
                pkCol: 'observation_id',
                pkTable: column.featureName,
                fkCol: 'observation_id',
                fkTable: column.tableName.replace('list_', 'list_m2m_')
            }))
            
        } else if (column.referenceDatatype == 'local') {

            createList.push(pgp.as.format(newAddColumn, {
                tableName: column.tableName,
                columnName: column.columnName,
                sqlDatatype: column.sqlDatatype,
                nullable: (column.nullable ? '' : 'NOT NULL')
            }))

        } else if (column.referenceDatatype == 'item' || column.referenceDatatype == 'location' ) {
            // For now new columns cannot be created with metadata_column entries!

                /* DEFINING LOCAL-GLOBAL AND SPECIAL FOR EVERY FEATURE
                1. Adding local-global and special entries to metdata_column for every feature
                2. Adding local-global columns to every feature
                3. Adding the data_auditor_name column to every feature
                4. Adding the Auditor Name trigger for every feature
                */

        } else if (column.referenceDatatype == 'local-global') { //LOCAL GLOBALS ARE SPECIFIED FOR EVERY FEATURE

            for(feature of features) { // Data column is added for every feature
                
                // 2.
                createList.push(pgp.as.format(newAddColumn, {
                    tableName: feature.tableName,
                    columnName: column.columnName,
                    sqlDatatype: column.sqlDatatype,
                    nullable: (column.nullable ? '' : 'NOT NULL')
                }))

            } //for every feature
        } else if (column.referenceDatatype == 'special' && column.frontendName == 'Auditor Name') {
            // special case for auditor name
            for(feature of features) { // for every feature
                // Data column is added for every feature
                createList.push(pgp.as.format(newAddColumn, {
                    tableName: feature.tableName,
                    columnName: column.columnName,
                    sqlDatatype: column.sqlDatatype,
                    nullable: (column.nullable ? '' : 'NOT NULL')
                }))

                // Auditor Name trigger is added for every feature
                refList.push(pgp.as.format(checkAuditorNameTrigger, {
                    tableName: feature.tableName
                }))

            } 
        }
        
    })
    
    return {cCreateList: createList, cRefList: refList, cMetadataList: metadataList};
};

//!! OLD !!//

/*
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
async function asyncConstructDataCols(ms) {
    console.log("Setting up foreign key constraints...")
    await timeout(ms); //we wait for the CREATE TABLE promises to resolve

    // Array of foreign key constrant queries
    let fkQueries = [];
    for(let index = 0; index < fkTable.length; index++) {
        fkQueries.push(db.none(pgp.as.format(reference.default, {fkTable: fkTable[index], fkCol: fkCol[index], pkTable: pkTable[index], pkCol: pkCol[index]})))
    }

    // Wait for all the queries to resolve and then close the connection
    Promise.all(fkQueries).then( () => {
        console.log("Done!")
        // closing the connection
        db.$pool.end();
    })
}
*/

/*

/////////////////////////////////////////////////////
// Recursive function to construct all subfeatures //
/////////////////////////////////////////////////////

function makeSubfeatures(parent, dependencies) {
    if('subfeatures' in parent) {
        //making subfeature tables
        for(let subfeature in parent.subfeatures) {
            
            //////////////////
            /// SUBFEATURE ///
            //////////////////

            //feature to item_auditor
            fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
            fkCol.push('auditor_id');
            pkTable.push('item_auditor');
            pkCol.push('item_id');

            //adding subfeature data and/or items
            
            if('additionalCols' in parent.subfeatures[subfeature]) {
                // CREATE TABLE subfeature_... with additional columns
                let cols = parent.subfeatures[subfeature].additionalCols.join(', ');
                db.none(pgp.as.format(createSubfeature.additional, {subfeature: subfeature, parent: dependencies.join("_"), additionalCols: cols}))
            } else {
                // CREATE TABLE subfeature_... with no additional columns
                db.none(pgp.as.format(createSubfeature.default, {subfeature: subfeature, parent: dependencies.join("_")}))
            };


            //subfeature to feature foreign key
            if(dependencies.length = 1) {
                fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
                fkCol.push('parent_id')
                pkTable.push(`feature_${dependencies.join("_")}`)
                pkCol.push('observation_id')
            } else {
                //subfeature to subfeature foreign key
                fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
                fkCol.push('parent_id')
                pkTable.push(`subfeature_${dependencies.join("_")}`)
                pkCol.push('observation_id')
            }
            
            ///////////////////
            /// FEATUREITEM ///
            /////////////////// 

            //featureitem items and data cols
            if('featureitem' in parent.subfeatures[subfeature]) {
                //adding data and item cols to featureitem
                if('additionalCols' in parent.subfeatures[subfeature].featureitem) {
                    let cols = parent.subfeatures[subfeature].featureitem.additionalCols.join(', ');
                    // CREATE TABLE featureitem_... (featureitem for a subfeature) with additional columns
                    db.none(pgp.as.format(createFeatureitem.additonal, {featureitem: String(dependencies.join("_") + `_${subfeature}`), additionalCols: cols}))
                } else {
                    // CREATE TABLE featureitem_... (featureitem for a subfeature) with no additional columns
                    db.none(pgp.as.format(createFeatureitem.default, {featureitem: String(dependencies.join("_") + `_${subfeature}`)}))
                }

                //featureitem to location foreign key
                if('location' in parent.subfeatures[subfeature].featureitem) { //This has to be true (should be validated)
                    if(['item_room', 'item_bulding'].includes(parent.subfeatures[subfeature].featureitem.location)) {
                        fkTable.push(`featureitem_${dependencies.join("_")}_${subfeature}`);
                        fkCol.push('location_id')
                        pkTable.push(parent.subfeatures[subfeature].featureitem.location)
                        pkCol.push('item_id')
                    } else {
                        fkTable.push(`featureitem_${dependencies.join("_")}_${subfeature}`);
                        fkCol.push('location_id')
                        pkTable.push(`location_${parent.subfeatures[subfeature].featureitem.location}`)
                        pkCol.push('location_id')
                    }
                }
            }
            //subfeature to featureitem foreign key
            fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
            fkCol.push('featureitem_id')
            pkTable.push(`featureitem_${dependencies.join("_")}_${subfeature}`)
            pkCol.push('featureitem_id')

            /////////////
            /// LISTS ///
            /////////////

            //lists and list_m2m for subfeatures
            if('lists' in parent.subfeatures[subfeature]) {
                for(let list of parent.subfeatures[subfeature].lists) {

                    //list_m2m to subfeature foreign key
                    fkTable.push(`list_m2m_${dependencies.join("_")}_${subfeature}_${list}`);
                    fkCol.push('observation_id')
                    pkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`)
                    pkCol.push('observation_id')
                    //list_m2m to list
                    fkTable.push(`list_m2m_${dependencies.join("_")}_${subfeature}_${list}`);
                    fkCol.push('list_id')
                    pkTable.push(`list_${dependencies.join("_")}_${subfeature}_${list}`)
                    pkCol.push('list_id')

                    // CREATE TABLE list_m2m_...
                    db.none(pgp.as.format(createListM2M.default, {parent: dependencies.join("_") + `_${subfeature}`, list: list}))
                    // CREATE TABLE list_...
                    db.none(pgp.as.format(createList.default, {parent: dependencies.join("_") + `_${subfeature}`, list: list}))
                }
            }

            //making the children subfeatures
            makeSubfeatures(parent.subfeatures[subfeature], [...dependencies, subfeature]) // !recursion
        };
    }
}

//////////////////////////
// database constructor //
//////////////////////////

var fkTable = []; 
var fkCol = [];
var pkTable = [];
var pkCol = [];

function constructDB(data) {

    console.log('Creating tables...')

    //making feature tables
    for(let feature in data) {

        ///////////////
        /// FEATURE ///
        ///////////////

        //feature to submission foreign key
        fkTable.push(`feature_${feature}`);
        fkCol.push('submission_id');
        pkTable.push('submission');
        pkCol.push('submission_id');

        //sop_m2m to feature foreign key
        fkTable.push('item_sop_m2m');
        fkCol.push('observation_id');
        pkTable.push(`feature_${feature}`);
        pkCol.push('observation_id');

        //feature to item_auditor
        fkTable.push(`feature_${feature}`);
        fkCol.push('auditor_id');
        pkTable.push('item_auditor');
        pkCol.push('item_id');

        //adding data and/or items
        if('additionalCols' in data[feature]) {
            let cols = data[feature]['additionalCols'].join(', ');
            //CREATE TABLE feature_... with additional columns
            db.none(pgp.as.format(createFeature.additional, {feature: feature, additionalCols: cols}))
        } else {
            //CREATE TABLE feature_... with no additional columns
            db.none(pgp.as.format(createFeature.default, {feature: feature}))
        }
         
        ///////////////////
        /// FEATUREITEM ///
        ///////////////////

        //adding featureitem table
        if('featureitem' in data[feature]) {
            //adding data and item cols to featureitem
            if('additionalCols' in data[feature].featureitem) {
                let cols = data[feature].featureitem['additionalCols'].join(', ');
                // CREATE TABLE featureitem_... with additional columns
                db.none(pgp.as.format(createFeatureitem.additional, {featureitem: feature, additionalCols: cols}))
            } else {
                // CREATE TABLE featureitem_... with no additional columns
                db.none(pgp.as.format(createFeatureitem.default, {featureitem: feature}))
            }

            //featureitem to location foreign key
            if('location' in data[feature].featureitem) {
                if(['item_room', 'item_building'].includes(data[feature].featureitem.location)) {
                    fkTable.push(`featureitem_${feature}`);
                    fkCol.push('location_id')
                    pkTable.push(data[feature].featureitem.location)
                    pkCol.push('item_id')
                } else {
                    fkTable.push(`featureitem_${feature}`);
                    fkCol.push('location_id')
                    pkTable.push(`location_${data[feature].featureitem.location}`)
                    pkCol.push('location_id')
                } 
            }
        };

        //feature to featureitem foreign key
        fkTable.push(`feature_${feature}`);
        fkCol.push('featureitem_id')
        pkTable.push(`featureitem_${feature}`)
        pkCol.push('featureitem_id')

        /////////////
        /// LISTS ///
        /////////////

        // adding lists
        if('lists' in data[feature]) {
            for(let list of data[feature].lists) {

                //list_m2m to feature foreign key
                fkTable.push(`list_m2m_${feature}_${list}`);
                fkCol.push('observation_id')
                pkTable.push(`feature_${feature}`)
                pkCol.push('observation_id')
                //list_m2m to list
                fkTable.push(`list_m2m_${feature}_${list}`);
                fkCol.push('list_id')
                pkTable.push(`list_${feature}_${list}`)
                pkCol.push('list_id')

                // CREATE TABLE list_m2m_...
                db.none(pgp.as.format(createListM2M.default, {parent: feature, list: list}))
                // CREATE TABLE list_...
                db.none(pgp.as.format(createList.default, {parent: feature, list: list}))
            }
        }

        //////////////////////////////////////////////
        /// CALLING RECURSIVE SUBFEATURE GENERATOR ///
        //////////////////////////////////////////////

        makeSubfeatures(data[feature], Array(feature))
        
    };
}

*/
