// LEGACY CODE //
// ============================================================
// This file is for legacy code that is no longer used. Although
// it is unlikely that it will be used in the future, it is best
// to not delete it for now. This file is never required by any
// other, so it will never be run.
// ============================================================


// Schema.js (deprecated) //
// ==================================================

// This script contains metadataFeatureInput and
// metadataColumn Input objects for globals and water audit.
// Keys for each object type are given below:

// ============================
// metadataFeatureInput
// ============================
// - tableName
// - parentTableName
// - frontendName
// - numFeatureRange
// - information
// - location (type)

// ============================
// metadataColumnInput
// ============================
// - featureName
// - rootFeatureName
// - columnName
// - tableName
// - referenceColumnName
// - referenceTableName
// - inputSelectorName
// - filterSelectorName
// - sqlDatatype
// - referenceDatatype
// - frontendDatatype
// - information
// - nullable
// - default
// - global
// - frontendName
// - groundTruthLocation

// ============================
// WATER AUDIT FEATURES
// ============================

newWaterAudit = JSON.parse(
    '[{"tableName":"feature_toilet","parentTableName":null,"frontendName":"Toilet","numFeatureRange":null,"information":"A fixed receptacle into which a person may urinate or defecate","location":"item_room"},\
    {"tableName":"feature_urinal","parentTableName":null,"frontendName":"Urinal","numFeatureRange":null,"information":"A bowl or other receptacle into which men may urinate","location":"item_room"},\
    {"tableName":"subfeature_urinal_divider","parentTableName":"feature_urinal","frontendName":"Divider","numFeatureRange":1,"information":"Privacy barriers between adjacent urinals","location":null},\
    {"tableName":"feature_sink","parentTableName":null,"frontendName":"Sink","numFeatureRange":null,"information":"A fixed basin with a water supply and a drain","location":"item_room"},\
    {"tableName":"feature_mirror","parentTableName":null,"frontendName":"Mirror","numFeatureRange":null,"information":"A reflective surface that reflects a clear image","location":"item_room"},\
    {"tableName":"feature_room","parentTableName":null,"frontendName":"Room","numFeatureRange":null,"information":"A part or division of a building enclosed by walls, floor, and ceiling","location":"item_room"}]')
    
    // ============================
    // GLOBAL AUDITING COLS
    // ============================
    
    /* NON SUBMISSION GLOBALS:
    SOP Name -> m2m through obs_count
    Auditor Name -> COALESCE(data_auditor_name, m2m through obs_count)
    Commentary -> data_commentary
    Time Conducted -> data_time_conducted
    */
    
    let dynamicGlobalAudit = [
    
        {  // DATE CONDUCTED
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_date_conducted',
            tableName: null,
            referenceColumnName: null,
            referenceTableName: null,
            inputSelectorName: 'calendarEqual',
            filterSelectorName: 'calendarRange',
            sqlDatatype: 'DATE',
            referenceDatatype: 'local',
            frontendDatatype: 'date',
            information: 'Date the feature was audited',
            nullable: false,
            default: true,
            global: true,
            frontendName: 'Date Conducted',
            groundTruthLocation: null
        },
        {  // Auditor Name - special because it is a COALESCE between two cols
            featureName: null,
            rootFeatureName: null,
            columnName: null,
            tableName: null,
            referenceColumnName: null,
            referenceTableName: null,
            inputSelectorName: 'searchableChecklistDropdown',
            filterSelectorName: 'searchableChecklistDropdown',
            sqlDatatype: 'TEXT',
            referenceDatatype: 'special',
            frontendDatatype: 'string',
            information: 'Name of the auditor(s) who conducted this observation',
            nullable: false, //this is weird because there are two cols, but one must not be null
            default: true,
            global: true,
            frontendName: 'Auditor Name',
            groundTruthLocation: null
        },
        {  // SOP NAME - special
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_name',
            tableName: 'tdg_sop',
            referenceColumnName: ['sop_id', 'sop_id', 'observation_count_id'],
            referenceTableName: ['tdg_sop', 'tdg_sop_m2m', 'tdg_sop_m2m'],
            inputSelectorName: 'searchableChecklistDropdown',
            filterSelectorName: 'searchableChecklistDropdown',
            sqlDatatype: 'TEXT',
            referenceDatatype: 'special',
            frontendDatatype: 'hyperlink',
            information: 'The standard operating procedure(s) used for the audit on this feature',
            nullable: false,
            default: true,
            global: true,
            frontendName: 'Standard Operating Procedure',
            groundTruthLocation: null
        },
        {  // COMMENTARY
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_commentary',
            tableName: null,
            referenceColumnName: null,
            referenceTableName: null,
            inputSelectorName: 'text',
            filterSelectorName: null,
            sqlDatatype: 'TEXT',
            referenceDatatype: 'local',
            frontendDatatype: 'string',
            information: 'Additional commentary about the observation',
            nullable: true,
            default: true,
            global: true,
            frontendName: 'Commentary',
            groundTruthLocation: null
        }
    ];
      
    let staticGlobalAudit = [
    
        {  // Template Name
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_template_name',
            tableName: 'item_template',
            referenceColumnName: ['item_id', 'item_template_id'],
            referenceTableName: ['item_template', 'tdg_submission'],
            inputSelectorName: null,
            filterSelectorName: 'searchableDropdown',
            sqlDatatype: 'TEXT',
            referenceDatatype: 'submission',
            frontendDatatype: 'string',
            information: 'Name of the template used for the submission\'s upload',
            nullable: false,
            default: true,
            global: true,
            frontendName: 'Template',
            groundTruthLocation: null
        },
        {  // Submission name
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_submission_name',
            tableName: 'tdg_submission',
            referenceColumnName: [],
            referenceTableName: [],
            inputSelectorName: 'text',
            filterSelectorName: 'searchableDropdown',
            sqlDatatype: 'TEXT',
            referenceDatatype: 'submission',
            frontendDatatype: 'string',
            information: 'Name of the audit submission',
            nullable: false,
            default: true,
            global: true,
            frontendName: 'Audit Submission Name',
            groundTruthLocation: null
        },
        {  // Submitting organization name
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_organization_name',
            tableName: 'item_organization',
            referenceColumnName: ['item_id', 'item_organization_id'],
            referenceTableName: ['item_organization', 'tdg_submission'],
            inputSelectorName: 'searchableDropdown',
            filterSelectorName: 'searchableChecklistDropdown',
            sqlDatatype: 'TEXT',
            referenceDatatype: 'submission',
            frontendDatatype: 'string',
            information: 'Name of organization who submitted the audit',
            nullable: false,
            default: true,
            global: true,
            frontendName: 'Auditing Organization',
            groundTruthLocation: null
        },
        {  // University name that submitting organization belongs to
            featureName: null,
            rootFeatureName: null,
            columnName: 'data_university_name',
            tableName: 'item_university',
            referenceColumnName: ['item_id', 'item_university_id', 'item_organization_id'],
            referenceTableName: ['item_university', 'item_organization', 'tdg_submission'],
            inputSelectorName: 'searchableDropdown',
            filterSelectorName: 'searchableChecklistDropdown',
            sqlDatatype: 'TEXT',
            referenceDatatype: 'submission',
            frontendDatatype: 'string',
            information: 'Name of the university that organization who submitted the audit belongs to',
            nullable: false,
            default: true,
            global: true,
            frontendName: 'Auditing Organization University',
            groundTruthLocation: null
        },
    ];
    
    
    
    
    let anotherTry = JSON.parse(newString)
    
    
    module.exports = {
        newWaterAudit
    };
    
    
    /*
    //!! OLD !!//

    
    
    ///////////////////////////
    // custom creation tools //
    ///////////////////////////
    
    // additional column constructor
    const col = {
        data: function(name, type, nullable='') {return `data_${name} ${type} ${nullable}`},
        item: function(name, nullable='') {return `item_${name}_id INTEGER ${nullable}`},
    }
    
    //Schema entry structure example:
    let example = {
        feature: {
            additionalCols: [
                col.data('some_rate', 'NUMERIC', "NOT NULL"),
                col.item('')
            ], //data or item columns for feature
            featureitem: {
                additionalCols: [], //data or item columns for featureitem of feature
                location: ''
            },
            lists: [], //names of lists associated with feature
            subfeatures: {}, //recursive
        }
    }
    
    ///////////////////////////
    // current audit schemas //
    ///////////////////////////
    
    //Current water audits
    const waterAudit = {
        toilet: {
            additionalCols: [
                col.data('gpf', 'NUMERIC', 'NOT NULL'),
                col.data('commentary', 'TEXT', '')
            ],
            featureitem: {location: 'item_room'}, 
            subfeatures: {
                flushometer: {
                    featureitem: {location: 'item_room'},
                    lists: ['brand', 'condition']
                },
                basin: {
                    featureitem: {location: 'item_room'},
                    lists: ['brand', 'condition']
                },
                stall: {
                    featureitem: {location: 'item_room'},
                    lists: ['condition']
                },
                sensor: {
                    featureitem: {location: 'item_room'},
                    lists: ['condition']
                }
            }
        },
        urinal: {
            additionalCols: [
                col.data('gpf', 'NUMERIC', 'NOT NULL'),
                col.data('commentary', 'TEXT', '')
            ],
            featureitem: {location: 'item_room'},
            subfeatures: {
                flushometer: {
                    featureitem: {location: 'item_room'},
                    lists: ['brand', 'condition']
                },
                basin: {
                    featureitem: {location: 'item_room'},
                    lists: ['brand', 'condition']
                },
                divider: {
                    featureitem: {location: 'item_room'},
                    lists: ['condition']
                },
                sensor: {
                    featureitem: {location: 'item_room'},
                    lists: ['condition']
                }
            }
        },
        sink: {
            additionalCols: [
                col.data('gpm', 'NUMERIC', 'NOT NULL'),
                col.data('commentary', 'TEXT', '')
            ],
            featureitem: {location: 'item_room'},
            subfeatures: {
                faucet: {
                    featureitem: {location: 'item_room'},
                    lists: ['brand', 'condition']
                },
                basin: {
                    featureitem: {location: 'item_room'},
                    lists: ['brand', 'condition']
                },
                sensor: {
                    featureitem: {location: 'item_room'},
                    lists: ['condition']
                }
            }
        },
        mirror: {
            featureitem: {location: 'item_room'},
            additionalCols: [
                col.data('commentary', 'TEXT', '')
            ],
            lists: ['condition']
        },
        room: {
            additionalCols: [
                col.data('exhaust_exit', 'BOOLEAN', ''),
                col.data('access_panel', 'BOOLEAN', ''),
                col.data('commentary', 'TEXT', '')
            ],
            featureitem: {location: 'item_room'}
        }
    }
    */


// Construct.js //
// ==================================================

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

    /*

    //let {fCreateList, fRefList, fMetadataList} = constructFeatures(featureSchema);
    //let featureCreateInsert = [...fCreateList, ...fMetadataList].map((sql) => db.none(sql));
    
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

    */
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
                    featureName: feature.tableName,
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

/*************
* Approach 1 *
*************/
var feature;
var subfeature;
var feature_item;
var list;
var list_m2m;

'SELECT list.data_elementname FROM list INNER JOIN list_m2m ON list_m2m.list_id = list.list_id'
'INNER JOIN subfeature ON subfeature.observation_id = list_m2m.observation_id;'

/*************
* Approach 2 *
**************/
var metadata_table;
var metadata_col;
var metadata_datatype;
var metadata_selector;

// How do we connect different metadata_tables? Still a little confused on how the metadata stuff works.
'SELECT metadata_col.information FROM metadata_col INNER JOIN metadata_table ON metadata_col.table_id = metadata_table.table_id;'


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

    