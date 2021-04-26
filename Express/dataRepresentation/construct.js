// ============================================================
// This script constructs feature/subfeature tables
// and simultaneously inserts relevant metadata.
//
// TODO: everything inside a transaction?
//
//    constraints: - no item can reference another item more than once
//                 - lists are always nullable
//                 - item cannot reference the same location type more than once
//                 - attributes are always non nullable
//                 - lists and factors are specific to one item or observation table
//
// ============================================================
const fs = require('fs'); // Import Node.js File System
const stripJsonComments = require('strip-json-comments'); // .jsonc handling
const chalk = require('chalk'); // pretty console.log
var util = require('util'); // util.inspect()


// Database connection and SQL formatter
const {postgresClient, connectPostgreSQL} = require('../db/pg.js');
// Establish an new connection pool
connectPostgreSQL('construct')
// get connection object
const db = postgresClient.getConnection.cdb;
// get SQL formatter
const formatSQL = postgresClient.format;

// Importing SQL //
// ============================================================
const {insert_m2m_metadata_item, 
       add_item_to_item_reference, 
       insert_metadata_column, 
       insert_metadata_feature, 
       insert_metadata_subfeature, 
       insert_metadata_item_observable, 
       create_observation_table, 
       create_subobservation_table, 
       create_observational_item_table, 
       add_unique_constraint, 
       add_data_col, 
       add_list, 
       add_location, 
       add_factor, 
       add_attribute, 
       getReturnables, 
       getItemParents, 
       makeItemReturnablesColumnQuery, 
       makeItemReturnablesFeatureQuery,
       makeItemReturbablesItemQuery, 
       makeItemReturnablesSubobservationQuery, 
       insert_metadata_returnable, 
       checkAuditorNameTrigger} = require('../statement.js').construct
    
const {allItems} = require('../statement.js').setup

// Construction CLI //
// ============================================================

// remove boilerplate argv elements
process.argv.splice(0, 2)

console.log(chalk.blue.bold(`Running ${process.argv[0]}`));

if(process.argv[0] == 'make-schema') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv[0];
    process.argv.splice(0, 1);
    // configure command line arguments
    (process.argv.includes('--show-computed') || process.argv.includes('-sc') ? commandLineArgs.showComputed = true : commandLineArgs.showComputed = false);
    // here we go
    return makeSchema(commandLineArgs);
} 
else if(process.argv[0] == 'config') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv[0];
    process.argv.splice(0, 1);
    // configure command line arguments
    let argFile = process.argv.filter(arg => /^--file=.*/.test(arg));
    if(argFile.length != 1) throw 'One file must be specified as a command line argument with \'--file=yourFile\'';
    commandLineArgs.file = argFile[0].match(/^--file=(.*)/)[1];
    (process.argv.includes('--show-computed') || process.argv.includes('-sc') ? commandLineArgs.showComputed = true : commandLineArgs.showComputed = false);
    // here we go
    return configSchema(commandLineArgs);
} 
else if(process.argv[0] == 'inspect') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // configure command line arguments
    if(process.argv.includes('--returnable') || process.argv.includes('-r')) {
        commandLineArgs.type = 'r'
        let argFilter = process.argv.filter(arg => /^--choose=.*/.test(arg));
        commandLineArgs.isSummary = process.argv.includes('-s') || process.argv.includes('--summary');
        commandLineArgs.isTree = process.argv.includes('-t') || process.argv.includes('--tree');
        commandLineArgs.isQueryString = process.argv.includes('-qs') || process.argv.includes('--query-string');
        commandLineArgs.isFullyIdentifyingSet = process.argv.includes('-fis') || process.argv.includes('--fully-identifying-set');
        if(argFilter.length == 1) {
            commandLineArgs.filter = argFilter[0].match(/^--choose=(.*)/)[1];
        } else {
            commandLineArgs.filter = null;
        }
        (process.argv.includes('-u') || process.argv.includes('--used') ? commandLineArgs.used = true : commandLineArgs.used = false);
    } else if(process.argv.includes('--feature') || process.argv.includes('-f')) {
        commandLineArgs.type = 'f'
    } else if(process.argv.includes('--column') || process.argv.includes('-c')) {
        commandLineArgs.type = 'c'
    } else {
        throw Error('\'construct inspect\' requires flag of \'-r\', \'-f\', or \'-f\'')
    }
    // here we go
    return inspectSchema(commandLineArgs);
} else {
    throw Error('Not a valid construction command');
};



// High Level Functions //
// ============================================================
async function makeSchema(commandLineArgs) {
    //console.log(commandLineArgs)

    // Read schema
    // Columns
    let columns = readSchema(`/auditSchemas/${commandLineArgs.schema}/columns.jsonc`);
    let globalColumns = readSchema('/auditSchemas/globalSchema/columns.jsonc');
    // Features
    let features = readSchema(`/auditSchemas/${commandLineArgs.schema}/features.jsonc`);

    // Call Construction Function
    await asyncConstructAuditingTables(features, [...columns, ...globalColumns], commandLineArgs);

    // Closing the database connection
    db.$pool.end
    console.log('Closed PostgreSQL Connection: construct')
}

async function configSchema(commandLineArgs) {
    //console.log(commandLineArgs)

    let schema = commandLineArgs.schema;
    let file = commandLineArgs.file;

    let controller = readSchema(`/auditSchemas/${schema}/${file}`);

    // sanity check
    if(controller.IDs.length !== controller.controller.length) {
        throw Error('Controller error: IDs and controller must be the same length');
    }

    // for every change
    for(let id of controller.IDs) {
        let change = controller.controller[controller.IDs.indexOf(id)]
        // if isUsed exists db.none
        if('isUsed' in change) {
            db.none(formatSQL('UPDATE metadata_returnable SET is_used = $(isUsed) WHERE returnable_id = $(id)', {
                isUsed: change.isUsed,
                id: id
            }));

            console.log(chalk.green(`Config: is_used column of ReturnableID:${id} updated to ${change.isUsed}`));
        }
        // if frontendName exists db.none
        if('frontendName' in change) {
            db.none(formatSQL('UPDATE metadata_returnable SET frontend_name = $(frontendName) WHERE returnable_id = $(id)', {
                frontendName: change.frontendName,
                id: id
            }));

            console.log(chalk.green(`Config: frontend_name column of ReturnableID:${id} updated to ${change.frontendName}`));
        }
    }      

    await showComputed(commandLineArgs);

    // Closing the database connection
    db.$pool.end
    console.log('Closed PostgreSQL Connection: construct')
}

async function inspectSchema(commandLineArgs) {
    let out;

    if(commandLineArgs.type === 'r') {

        if(commandLineArgs.used === true) {
            if(commandLineArgs.filter !== null) {
                // if non observational
                if(/^item_.*/.test(commandLineArgs.filter)) {
                    out = await db.any(formatSQL('SELECT * FROM metadata_returnable AS r join metadata_item as i on r.item_id = i.item_id WHERE i.table_name = $(item) AND r.is_used = true', {
                        item: commandLineArgs.filter
                    }))
                } else {
                    out = await db.any(formatSQL('SELECT * FROM metadata_returnable AS r WHERE r.feature_id = (SELECT feature_id FROM metadata_feature WHERE table_name = $(filter)) AND r.is_used = true', {
                        filter: commandLineArgs.filter
                    }));
                }

            } else {
                out = await db.any('SELECT * FROM metadata_returnable WHERE is_used = true')
            }
        } else {
            if(commandLineArgs.filter !== null) {
                // if non observational
                if(/^item_.*/.test(commandLineArgs.filter)) {
                    out = await db.any('SELECT * FROM returnable_view as r WHERE r.non_obs_i__table_name = $(item)', {
                        item: commandLineArgs.filter
                    })
                } else {
                    out = await db.any(formatSQL('SELECT * FROM returnable_view as r WHERE r.f__table_name = $(filter)', {
                        filter: commandLineArgs.filter
                    }));
                }

                // if FIS trim to only include FIS returnables
                /*

                Not done yet because not only item-id returnables must be selected, but also
                only returnables that traverse ID required items. Going to need to write a handler for this 
                for upload anyway...

                if(commandLineArgs.isFullyIdentifyingSet) {
                    out = out.filter(returnable => returnable.rt__type_name == 'item-id')
                    
                }
                */
                
                if(commandLineArgs.isSummary) {
                    const originalOut = Array.from(out);
                    out = {};
                    originalOut.forEach(r => {
                        out[r.r__returnable_id] = r.r__frontend_name
                    })
                } else if(commandLineArgs.isTree) {
                    const originalOut = Array.from(out);
                    out = {};
                    originalOut.forEach(r => {
                        // this is just formatting
                        out[r.r__returnable_id] = (r.r__join_object.tables.length > 0 ? `${r.r__join_object.tables.filter((e,i) => (i % 2 == 0 || i+1 == r.r__join_object.tables.length )).join(' > ')}: ${r.r__frontend_name}` : (/^item_.*/.test(commandLineArgs.filter) ? r.non_obs_i__table_name : r.f__table_name) + ': ' + r.r__frontend_name)
                    })
                } else if(commandLineArgs.isQueryString) {
                    const originalOut = Array.from(out);
                    // If you're reading this I'm sorry
                    out = [originalOut.length, originalOut.map(r => r.r__returnable_id).join('&')]
                }
                
            } else {
                out = await db.any('SELECT * FROM metadata_returnable')
            }
        }
        
    } else if(commandLineArgs.type === 'f') {
        out = await db.any('SELECT * FROM metadata_feature');
    } else if(commandLineArgs.type === 'c') {
        out = await db.any('SELECT * FROM metadata_column');
    }

    let count = (commandLineArgs.isSummary || commandLineArgs.isTree ? Object.keys(out).length : out.length)

    // handling for query string
    // I'm really sorry I know this sucks a lot
    if(commandLineArgs.isQueryString) {
        count = out[0]
        out = out[1]        
    }

    console.log(out)
    console.log(chalk.cyanBright.underline(`Count: ${count}`))

    // Closing the database connection
    db.$pool.end
    console.log('Closed PostgreSQL Connection: construct')
}


// Functions //
// ============================================================


/* asyncConstructAuditingTables (featureSchema, columnSchema)
============================================================
Takes a list of metadataFeatureInput objects (featureSchema)
and list of metadataColumnInput objects (columnSchema)
to execute all SQL statements to construct relevant tables

in: featureSchema: Array of metadataFeatureInput objects (parsed features.jsonc)
    columnSchema: Array of metadataColumnInput objects (parsed columns.jsonc)

out: nothing (database queries are made within)
============================================================ */

async function asyncConstructAuditingTables(featureSchema, columnSchema, commandLineArgs) {

    // Step 1.
    /*
        1.  in: featureInput
        - create item_... tables for root features
            create_observational_item_table(feature_name TEXT)
                -> item table name
        - add foreign key constraints for observational item tables
            add_item_to_item_reference(item_name TEXT, requiredItem regclass, isID BOOLEAN, isNullable BOOLEAN)
        - insert observable items into metadata_item
            insert_metadata_item_observable(item, creationpriv)
        - insert item to item relations into m2m_metadata_item
            insert_m2m_metadata_item(item)
        - create observation_... and subobservation_... tables (obs first!)
            create_observation_table
            create_subobservation_table
        - insert features into metadata_feature
            insert_metadata_feature
            insert_metadata_subfeature
    */
    //console.log('\x1b[1m', '1. Constructing Features')
    console.log(chalk.whiteBright.bold('1. Constructing Features'));

    let featureOutput = await constructFeatures(featureSchema);
    // if there is an error in feature construction exit function
    if(featureOutput.error === true) {
        return
    }

    console.log(chalk.green('Done Constructing Features \n'))

    // Step 2.
    /*
    2.  in: columnInput
            forEach column:
                - insert column into metadata_column
                switch (refType) 
                    item-id
                        add item data col
                    item-non-id
                        add item data col
                    item-list
                        create list and m2m tables
                        add foreign keys
                    item-location
                        add location_<type> column
                        add foreign key
                    item-factor
                        create factor table
                        add item reference column
                        add foreign key
                    obs
                        add observation data column
                    obs-global
                        add observation data column for every feature
                    obs-list
                        create list and m2m tables
                        add foreign keys
                    obs-factor
                        create factor table
                        add item reference column
                        add foreign key
                    special
                        perform special operation for every feature
                    attribute 
                        create attribute table
                        add attribute reference column in observation_... table
                        add attribute reference column in item_... table
            - add observable item_... table unique constraints
    */
    console.log(chalk.whiteBright.bold('2. Constructing Columns'));

    let columnOutput = await addDataColumns(columnSchema, featureSchema, featureOutput.itemIDColumnLookup, featureOutput.featureItemLookup);
    // if there is an error in column construction exit function
    if(columnOutput.error === true) {
        return 
    }

    // Intermezzo: construct the itemParents object
    let itemParentLookup = await makeItemParentLookup();
    featureOutput.itemParentLookup = itemParentLookup

    console.log(chalk.green('Constructed the itemParents object'));
    
    console.log(chalk.green('Done Constructing Columns \n'));

    // Step 3.
    // Generate Returnables and insert into metadata_returnable
    // maybe get all the features from step 1 and then iterate through
    // them and call generateReturnables

    console.log(chalk.whiteBright.bold('3. Constructing Returnables'));

    // for each root feature generate returnables
    for(let feature of Object.keys(featureOutput.featureItemLookup)) {
        console.log(chalk.whiteBright.bold(`Constructing returnables for the ${feature} feature`));
        let itemArray = [
            {
                featureName: feature,
                itemName: featureOutput.featureItemLookup[feature],
                originalItemName: featureOutput.featureItemLookup[feature],
                path: [feature, featureOutput.featureItemLookup[feature]]
            }
        ];

        // Calling generateReturnables
        let returnables = await generateReturnables(itemArray, [], itemParentLookup, featureOutput.itemRealGeoLookup, featureOutput.featureItemLookup);
        console.log(chalk.whiteBright.bold(`Constructed IDs: ${returnables.join(', ')} for the ${feature} feature \n`));
    };

    // for non observable items generate returnables
    // first get all non observable items
    const nonObservableItems = await db.many('SELECT * FROM non_observable_item_view');
    
    for(let item of nonObservableItems.map(item => item.i__table_name)) {
        console.log(chalk.whiteBright.bold(`Constructing returnables for the ${item} item`));
        let itemArray = [
            {
                featureName: null,
                itemName: item,
                originalItemName: item,
                path: []
            }
        ];
        let returnables = await generateReturnables(itemArray, [], itemParentLookup, featureOutput.itemRealGeoLookup, featureOutput.featureItemLookup);
        console.log(chalk.whiteBright.bold(`Constructed IDs: ${returnables.join(', ')} for ${item} \n`));
    
    }
    // Creating the computed file and returnables folder 
    await showComputed(commandLineArgs);

    // Creating schema assets
    await makeAssets(featureOutput);
    
    // Done!
    console.log(chalk.blueBright.bgWhiteBright('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
    console.log(chalk.blueBright.bgWhiteBright('                             '));
    console.log(chalk.green.bgWhiteBright('   Successful Construction   '));
    console.log(chalk.blueBright.bgWhiteBright('                             '));
    console.log(chalk.blueBright.bgWhiteBright('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
    console.log(chalk.black.bgWhiteBright(' Long live the power source! '));
    
};



/* constructFeatures (features)
============================================================
Inserts all the features into metadata_features and creates the 
observation_..., subobservation_... and observable item tables
 needed for the features to exist in the schema

in: features: Array of metadataColumnInput objects (parsed features.jsonc)

out: errorObject: specifies if there is an error
     itemIDColumnLookup: item -> Array of ID Columns
     featureItemLookup: feature -> item
     itemRealGeoLookup: item -> realGeo object
============================================================ */
async function constructFeatures(features) {

    let featureItemLookup = {};
    let itemIDColumnLookup = {};
    let itemRealGeoLookup = {};

    // Split root features and subfeatures
    let rootFeatures = features.filter(feature => feature.observableItem !== null);
    let subfeatures = features.filter(feature => feature.observableItem === null);

    // Sanity check
    if([...rootFeatures, ...subfeatures].length !== features.length) {
        return constructjsError('Root features and subfeatures do not partition all features')
    }

    // a. Create item_... tables for root features and make lookups
    for(let feature of rootFeatures) {
        try {
            // Wait for item table creation and return item table name
            let item = await db.one(formatSQL(create_observational_item_table, {
                featureName: feature.tableName
            }));

            item = item.create_observational_item_table;

            console.log(chalk.green(`Feature Construction: Observable item table created for ${feature.tableName}`));

            // make lookups
            featureItemLookup[feature.tableName] = item;
            itemIDColumnLookup[item] = [];
            itemRealGeoLookup[featureItemLookup[feature.tableName]] = feature.observableItem.realGeo;

        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    };

    // b. Insert observable items into metadata_item
    for(let feature of rootFeatures) {
        try {
            await db.none(formatSQL(insert_metadata_item_observable, {
                itemName: featureItemLookup[feature.tableName],
                frontendName: feature.observableItem.frontendName,
                creationPrivilege: feature.observableItem.creationPrivilege
            }));

            console.log(chalk.green(`Feature Metadata: Inserted ${featureItemLookup[feature.tableName]} into metadata_item`));
        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    };

    // c. Add foreign key constraints for observational item tables
    // d. Insert item to item relations into m2m_metadata_item    
    for(let feature of rootFeatures) {
        // for every required item in the feature
        for(let required of feature.observableItem.requiredItem) {
            try {
                // c.
                let idColumn = await db.one(formatSQL(add_item_to_item_reference, {
                    observableItem: featureItemLookup[feature.tableName],
                    referenced: required.name,
                    isID: required.isID,
                    isNullable: required.isNullable
                }));

                idColumn = idColumn.idcolumn;

                itemIDColumnLookup[featureItemLookup[feature.tableName]].push(idColumn);

                console.log(chalk.green(`Feature Construction: ${featureItemLookup[feature.tableName]} to ${required.name} relation created`));

                // d.
                await db.none(formatSQL(insert_m2m_metadata_item, {
                    observableItem: featureItemLookup[feature.tableName],
                    referenced: required.name,
                    isID: required.isID,
                    isNullable: required.isNullable,
                    frontendName: required.frontendName,
                    information: required.information
                })); 

                console.log(chalk.green(`Feature Metadata: Inserted ${featureItemLookup[feature.tableName]} to ${required.name} relation into m2m_metadata_item`));
            } catch(sqlError) {
                return constructjsError(sqlError);
            }
        }
    };

    // e. Create observation_... tables
    // f. Insert features into metadata_feature
    // filtering to get just root features
    for(let rootFeature of rootFeatures) {
        try {
            // e.
            await db.none(formatSQL(create_observation_table, {
                tableName: rootFeature.tableName
            }));

            console.log(chalk.green(`Feature Construction: Created ${rootFeature.tableName} table`));

            //f. 
            await db.none(formatSQL(insert_metadata_feature, {
                tableName: rootFeature.tableName,
                itemTableName: featureItemLookup[rootFeature.tableName],
                information: rootFeature.information,
                frontendName: rootFeature.frontendName
            }));

            console.log(chalk.green(`Feature Metadata: Inserted ${rootFeature.tableName} into metadata_feature`));

        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    };

    // g. Create subobservation_... tables
    // h. Insert subfeatures into metadata_feature
    // filtering to get just subfeatures
    for(let subfeature of subfeatures) {
        try {
            // g.
            await db.none(formatSQL(create_subobservation_table, {
                tableName: subfeature.tableName,
                parentTableName: subfeature.parentTableName
            }));

            console.log(chalk.green(`Feature Construction: Created ${subfeature.tableName} table`));

            // h.
            await db.none(formatSQL(insert_metadata_subfeature, {
                tableName: subfeature.tableName,
                parentTableName: subfeature.parentTableName,
                numFeatureRange: subfeature.numFeatureRange,
                information: subfeature.information,
                frontendName: subfeature.frontendName
            }));

            console.log(chalk.green(`Feature Metadata: Inserted ${subfeature.tableName} into metadata_feature`));
        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    };

    // No construction errors
    return {error: false, itemIDColumnLookup, featureItemLookup, itemRealGeoLookup};
};



/* addDataColumns (columns, features, itemIDColumnLookup, featureItemLookup)
============================================================
Inserts all the columns into metadata_column and creates the 
tables or columns needed for the column to exist in the schema

in: columns: Array of metadataFeatureInput objects (parsed features.jsonc)
    features: Array of metadataColumnInput objects (parsed features.jsonc)
    itemIDColumnLookup: item -> Array of ID Columns
    featureItemLookup: feature -> item

out: errorObject: specifies if there is an error
============================================================ */

async function addDataColumns(columns, features, itemIDColumnLookup, featureItemLookup) {

    // Globals
    // These data columns are defined for every feature
    for(let column of columns.filter(column => column.referenceType === 'obs-global' || column.referenceType === 'special')) {
        // for every root feature
        for(let feature of features.filter(f => f.parentTableName === null)) {

            //console.log(chalk.red.bgWhite(util.inspect(feature)))
            let itemTableName;
            // if subfeature
            if(feature.parentTableName !== null) {
                itemTableName = featureItemLookup[feature.parentTableName];
            } else { // then root feature
                itemTableName = featureItemLookup[feature.tableName];
            }
            // insert into metadata_column
            try {
                await db.none(formatSQL(insert_metadata_column, {
                    columnName: column.columnName,
                    tableName: (column.tableName === null ? feature.tableName : column.tableName),
                    observationTableName: column.observationTableName,
                    subobservationTableName: column.subobservationTableName,
                    itemTableName: itemTableName,
                    isDefault: column.isDefault,
                    isNullable: column.isNullable,
                    frontendName: column.frontendName,
                    filterSelectorName: column.filterSelectorName,
                    inputSelectorName: column.inputSelectorName,
                    frontendType: column.frontendType,
                    information: column.information,
                    accuracy: column.accuracy,
                    sqlType: column.sqlType,
                    referenceType: column.referenceType
                }));

                console.log(chalk.green(`Column Metadata: Inserted global column ${column.columnName} into metadata_column for ${featureItemLookup[feature.tableName]}`));
            } catch(sqlError) {
                return constructjsError(sqlError);
            }

            // if observation-global add the data column for all features
            if(column.referenceType === 'obs-global') {
                try {
                    await db.none(formatSQL(add_data_col, {
                        tableName: feature.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable
                    }))

                    console.log(chalk.green(`Column Construction: Added global column ${column.columnName} to ${feature.tableName}`));
                } catch(sqlError) {
                    return constructjsError(sqlError);
                }
            }

            // Auditor Name Special Case
            if(column.referenceType === 'special' && column.frontendName === 'Auditor Name') {
                await db.none(formatSQL(add_data_col, {
                    tableName: feature.tableName,
                    columnName: column.columnName,
                    sqlType: column.sqlType,
                    isNullable: column.isNullable
                }))

                console.log(chalk.green(`Column Construction: Added special column ${column.columnName} to ${feature.tableName}`));

                // Auditor Name trigger is added for every feature
                await db.none(formatSQL(checkAuditorNameTrigger, {
                    tableName: feature.tableName
                }))

                console.log(chalk.green(`Column Construction: Added 'Auditor Name' trigger function to ${feature.tableName}`));
            }
            
        }
        
    };

    // Standard columns (Non global)
    for(let column of columns.filter(column => column.referenceType !== 'obs-global' && column.referenceType !== 'special')) {

        //console.log(chalk.red.bgWhite(util.inspect(column)))

        // insert into metadata_column
        try {
            await db.none(formatSQL(insert_metadata_column, {
                columnName: column.columnName,
                tableName: column.tableName,
                observationTableName: column.observationTableName,
                subobservationTableName: column.subobservationTableName,
                itemTableName: column.itemName,
                isDefault: column.isDefault,
                isNullable: column.isNullable,
                frontendName: column.frontendName,
                filterSelectorName: column.filterSelectorName,
                inputSelectorName: column.inputSelectorName,
                frontendType: column.frontendType,
                information: column.information,
                accuracy: column.accuracy,
                sqlType: column.sqlType,
                referenceType: column.referenceType
            }));

            console.log(chalk.green(`Column Metadata: Inserted column ${column.columnName} into metadata_column for ${column.itemName}`));
        } catch(sqlError) {
            return constructjsError(sqlError);
        }

        try {
            switch (column.referenceType) {
                case 'item-id':
                    // reference type test
                    if((column.itemName !== column.tableName) || column.isNullable !== false) {
                        throw 'item-id returnables must have matching table name and item name, and be not nullable';
                    };

                    // add to the id column lookup
                    itemIDColumnLookup[column.itemName].push(column.columnName);
    
                    // schema generation
                    await db.none(formatSQL(add_data_col, {
                        tableName: column.tableName, // same as itemName
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable // must be false
                    }));

                    console.log(chalk.green(`Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`));
                    break;

                case 'item-non-id':
                    // reference type test
                    if(column.itemName !== column.tableName) {
                        throw 'item-non-id returnables must have matching table name and item name';
                    };

                    await db.none(formatSQL(add_data_col, {
                        tableName: column.tableName, // same as itemName
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable
                    }));

                    console.log(chalk.green(`Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`));
                    break;

                case 'item-list':
                    // reference type test
                    if(/^list_/.test(column.tableName) !== true) {
                        throw 'item-list returnables must be within a list_... table';
                    };
                    
                    await db.none(formatSQL(add_list, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isObservational: false  // false because item-list and not obs-list
                    }));

                    console.log(chalk.green(`Column Construction: Created ${column.tableName} tables with ${column.columnName} column for ${column.itemName}`));
                    break;

                case 'item-location':
                    // reference type test
                    if(/^location_/.test(column.tableName) !== true) {
                        throw 'item-location returnables must be within a location_... table';
                    };

                    await db.none(formatSQL(add_location, {
                        itemTableName: column.itemName,
                        locationTableName: column.tableName,
                        isNullable: column.isNullable
                    }));

                    console.log(chalk.green(`Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`));
                    break;
                    
                case 'item-factor':
                    // reference type test
                    if(/^factor_/.test(column.tableName) !== true) {
                        throw 'item-factor returnables must be within a factor_... table';
                    };
                    
                    await db.none(formatSQL(add_factor, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable,
                        isObservational: false  // false because item-factor and not obs-factor
                    }));

                    console.log(chalk.green(`Column Construction: Created ${column.tableName} table with ${column.columnName} column for ${column.itemName}`));
                    break;

                case 'obs':
                    
                    await db.none(formatSQL(add_data_col, {
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable
                    }));

                    console.log(chalk.green(`Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`));
                    break;
                    
                case 'obs-global':

                    // This shouldn't happen!
                    throw 'Global observation columns should have been handled earlier in the function';

                case 'obs-list':
                    // reference type test
                    if(/^list_/.test(column.tableName) !== true) {
                        throw 'obs-list returnables must be within a list_... table';
                    };
                    
                    await db.none(formatSQL(add_list, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isObservational: true  // true because obs-list and not item-list
                    }));

                    console.log(chalk.green(`Column Construction: Created ${column.tableName} tables with ${column.columnName} column for ${column.itemName}`));
                    break;

                case 'obs-factor':
                    // reference type test
                    if(/^factor_/.test(column.tableName) !== true) {
                        throw 'obs-factor returnables must be within a factor_... table';
                    };
                    
                    await db.none(formatSQL(add_factor, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable,
                        isObservational: true  // true because obs-factor and not item-factor
                    }));

                    console.log(chalk.green(`Column Construction: Created ${column.tableName} table with ${column.columnName} column for ${column.itemName}`));
                    break;

                case 'special':

                    // This shouldn't happen!
                    throw 'Special columns should have been handled earlier in the function';

                case 'attribute':
                    // reference type test
                    if(/^attribute_/.test(column.tableName) !== true) {
                        throw 'attribute returnables must be within an attribute_... table';
                    };
                    
                    await db.none(formatSQL(add_attribute, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType
                    }));
                    
                    console.log(chalk.green(`Column Construction: Created ${column.tableName} table with ${column.columnName} column for ${column.itemName}`));
                    break;

                default:
                    throw `column ${column.columnName} has an invalid reference type of ${column.referenceType}`
            }
        } catch(sqlError) {
            return constructjsError(sqlError);
        };
    };

    // Adding unique constraints
    for(let item in itemIDColumnLookup) {

        let uniqueOver = itemIDColumnLookup[item].join(', ');
        try {
            await db.none(formatSQL(add_unique_constraint, {
                tableName: item,
                uniqueOver: uniqueOver
            }));   
        } catch(sqlError) {
            return constructjsError(sqlError);
        }
        
        console.log(chalk.green(`Column Construction: Created unique constraint on ${item} over ID columns ${uniqueOver}`));
    }

    // No construction errors
    return {error: false};
}



/* generateReturnables (itemArray, returnableArray, itemParentLookup, itemRealGeoLookup)
============================================================
in: itemArray: Array of items to find returnables for and their paths
    returnableArray: The array of returnables found within the recursion (starts out empty)
    itemParentLookup: item -> Array of parent items
    itemRealGeoLookup: item -> realGeo object

out: returnableArray: The complete array of returnableIDs

    Finding returnables
        1. start at feature and go to corresponding observable item
        2. find all data columns for that item
        3. go to that item's referenced items and go back to step 2
============================================================ */
async function generateReturnables(itemArray, returnableArray, itemParentLookup, itemRealGeoLookup, featureItemLookup) {

    let referencedItems = [];

    // For every item in round
    for(let itemObject of itemArray) {

        // generate returnable for every data column within or referenced by item
        // Calling makeItemReturnables
        let itemReturnables = await makeItemReturnables(itemObject, itemRealGeoLookup, featureItemLookup)

        // add returnables to master list
        returnableArray = [...returnableArray, ...itemReturnables];

        // if item has a parent calculate new path and add to referencedItems array 
        if(itemObject.itemName in itemParentLookup) {

            let parentItemArray = itemParentLookup[itemObject.itemName]

            // for each parent item
            parentItemArray.forEach(parent => {

                console.log(chalk.greenBright.underline(`Returnable Construction: Added parent item ${parent.itemName} of child item ${itemObject.itemName} to item stack`))

                // Make path with new item
                let newPath = [...itemObject.path, ...[itemObject.itemName, parent.itemName]]

                console.log(chalk.greenBright(`Returnable Construction: Path Updated: ${itemObject.path.join(', ')} -> ${newPath.join(', ')}`))

                // add parent to referencedItems
                referencedItems.push({
                    featureName: itemObject.featureName,
                    itemName: parent.itemName,
                    originalItemName: itemObject.originalItemName,
                    path: newPath
                })
            })
            
        }
    };
        
    if(referencedItems.length > 0) {
        // call again with new items and pass found returnables
        return generateReturnables(referencedItems, returnableArray, itemParentLookup, itemRealGeoLookup, featureItemLookup)
    } else {
        // return all the returnables
        return returnableArray
    }
    
}



/* makeItemReturnables (itemObject, itemRealGeoLookup, featureItemLookup)
============================================================
in: itemObject: Object that contains the feature, item, and path
    itemRealGeoLookup: contains the info to identify a real geo column
    featureItemLookup: feature -> item

out: returnables: Array of the returnables for the item
============================================================ */
async function makeItemReturnables(itemObject, itemRealGeoLookup, featureItemLookup) {
    let returnables = [];
    let joinObject = {
        columns: [],
        tables: []
    };
    let featureID;
    let itemID;
    let isRealGeo = false;
    let rootFeatureID;

    // go to metadata_column and find all columns for said item
    let columns = await db.any(formatSQL(makeItemReturnablesColumnQuery, {
        itemName: itemObject.itemName
    }));

    // if observable get the featureID
    if(itemObject.featureName !== null) {
        
        featureID = await db.one(formatSQL(makeItemReturnablesFeatureQuery, {
            featureName: itemObject.featureName
        }));

        featureID = featureID.featureid;
        itemID = null
    }
    // if non observable get the itemID
    else {
        
        itemID = await db.one(formatSQL(makeItemReturbablesItemQuery, {
            itemName: itemObject.originalItemName
        }));

        itemID = itemID.itemid;
    }

    // construct joinObject from path
    // if path exists
    if(itemObject.path.length > 0) {
        // sanity check
        if(itemObject.path.length % 2 !== 0) {
            throw 'References must come in sets of 2'
        }
        // copy tables
        joinObject.tables = Array.from(itemObject.path)
        // make columns
        for(let n = 0; n < itemObject.path.length; n += 2) {
            if(n == 0 && itemObject.featureName !== null) { // if first join and not item
                // push the item_id column (in both the observation_... and item_... table)
                joinObject.columns.push('observableitem_id', 'item_id');
                //joinObject.columns.push('item_id');
            } else {
                // push foreign key column
                joinObject.columns.push(`${itemObject.path[n+1]}_id`, 'item_id');
                // push primary key column
                //joinObject.columns.push('item_id');
            }
        }
    }

    // if this is not the feature's observable item we ignore all non item-... columns
    if(featureItemLookup[itemObject.featureName] !== itemObject.itemName) {
        columns = columns.filter(col => ['item-id', 'item-non-id', 'item-list', 'item-location', 'item-factor', 'attribute'].includes(col.referencetypename))
    }
    
    // for each column related to the item
    for(let col of columns) {
        // PK
        let columnID = col.columnid;
        let frontendName = col.frontendname;
        let insertableJoinObject;
        let insertableFeatureID = featureID;
        // this is lowkey kind of dumb. The attributeType is different between cols so we can't
        // mutate the base joinObject. I'm sure there's a better way.

        // if item-... and not obs-... reference type
        if(['item-id', 'item-non-id', 'item-list', 'item-location', 'item-factor', 'attribute'].includes(col.referencetypename)) {
            insertableJoinObject = {
                columns: joinObject.columns,
                tables: joinObject.tables,
                attributeType: null
            };
        } else { // empty columns and tables for obs-... reference types
            insertableJoinObject = {
                columns: [],
                tables: [],
                attributeType: null
            }
        };

        // if not global
        if(itemObject.featureName !== null) {
            // is it the realGeo column?
            let itemRealGeo = itemRealGeoLookup[featureItemLookup[itemObject.featureName]];
            // if it passes the identifying conditions, then it is the real geo
            if(itemRealGeo.itemName == itemObject.itemName && itemRealGeo.tableName == col.tablename && itemRealGeo.columnName == col.columnname) {
                isRealGeo = true;
            }

            // if subobservation
            if(col.subobservationtablename !== null) {  

                queryFeatureID = await db.one(formatSQL(makeItemReturnablesSubobservationQuery, {
                    subobservationTableName: col.subobservationtablename
                }));

                insertableFeatureID = queryFeatureID.featureid;

            } else {
                // else then feature is already root
                rootFeatureID = null;
            }

        } else { // else then global and no feature or geo information
            isRealGeo = false;
            insertableFeatureID = null;
            rootFeatureID = null;
        }

        // attribute edge case where one column maps to 2 returnables
        if(col.referencetypename === 'attribute') {
            // if this is not the feature's observable item we only use 'current' attribute
            if(featureItemLookup[itemObject.featureName] !== itemObject.itemName) {

                // set attribute type
                insertableJoinObject.attributeType = 'current';
                // make valid JSON
                let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

                // insert returnable into metadata_returnable and get returnableID
                let returnableID = await db.one(formatSQL(insert_metadata_returnable, {
                    columnID: columnID,
                    itemID: itemID,
                    featureID: insertableFeatureID,
                    rootFeatureID: rootFeatureID,
                    frontendName: 'Current ' + frontendName,
                    isUsed: true,
                    joinObject: insertableJoinObject_,
                    isRealGeo: isRealGeo
                }));

                returnableID = returnableID.returnableid;

                returnables.push(returnableID);
                console.log(chalk.green(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`));

            } else { // special case of two returnables per column

                // set attribute type
                insertableJoinObject.attributeType = 'current';
                // make valid JSON
                let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

                // insert returnable into metadata_returnable and get returnableID
                let returnableID = await db.one(formatSQL(insert_metadata_returnable, {
                    columnID: columnID,
                    itemID: itemID,
                    featureID: insertableFeatureID,
                    rootFeatureID: rootFeatureID,
                    frontendName: 'Current ' + frontendName,
                    isUsed: true,
                    joinObject: insertableJoinObject_,
                    isRealGeo: isRealGeo
                }));

                returnableID = returnableID.returnableid;

                returnables.push(returnableID);
                console.log(chalk.green(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`));


                // set attribute type
                insertableJoinObject.attributeType = 'observed';
                // make valid JSON
                insertableJoinObject_ = JSON.stringify(insertableJoinObject);

                // insert returnable into metadata_returnable and get returnableID
                returnableID = await db.one(formatSQL(insert_metadata_returnable, {
                    columnID: columnID,
                    itemID: itemID,
                    featureID: insertableFeatureID,
                    rootFeatureID: rootFeatureID,
                    frontendName: 'Observed ' + frontendName,
                    isUsed: true,
                    joinObject: insertableJoinObject_,
                    isRealGeo: isRealGeo
                }));

                returnableID = returnableID.returnableid;

                returnables.push(returnableID);
                console.log(chalk.green(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`));
            }
        } else { //then not an attribute and do things normally

            // make valid JSON
            let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

            // insert returnable into metadata_returnable and get returnableID
            let returnableID = await db.one(formatSQL(insert_metadata_returnable, {
                columnID: columnID,
                itemID: itemID,
                featureID: insertableFeatureID,
                rootFeatureID: rootFeatureID,
                frontendName: frontendName,
                isUsed: true,
                joinObject: insertableJoinObject_,
                isRealGeo: isRealGeo
            }));

            returnableID = returnableID.returnableid;

            returnables.push(returnableID);

            // if non observable
            if(itemObject.featureName === null) {
                console.log(chalk.green(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.itemName} item`));
            } else {
                console.log(chalk.green(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`));
            }
            
        }
        
    };

    return returnables;
}



// Helper Functions //
// ============================================================


async function makeItemParentLookup() {
    /*
        {
            child: [{itemName: String, isID: Boolean}, ...],
            ...
        }
    */
    let itemParentLookup = {};

    // query metadata to get in {child: String, parent_: String, isID: Boolean} format
    let query = await db.any(getItemParents);

    // fill itemParents
    query.forEach(rel => {
        // if item hasn't been added to object yet add it
        if(!(rel.child in itemParentLookup)) {
            itemParentLookup[rel.child] = [];
        } 
        itemParentLookup[rel.child].push({itemName: rel.parent_, isID: rel.isid});
    });

    return itemParentLookup;
};



function constructjsError(error) {
    console.log(chalk.bgWhite.red(error));
    console.log(chalk.bgWhite.red('CONSTRUCT.JS EXECUTION HALTED'));
    throw Error('Error in construction of schema! You must drop the database and try again.');
}



function readSchema(file) { // Schema read function
    return JSON.parse(stripJsonComments(fs.readFileSync(__dirname + file, 'utf8')))
}

async function makeAssets(featureOutput) {
    const {itemIDColumnLookup, featureItemLookup, itemRealGeoLookup, itemParentLookup} = featureOutput;
    
    // Adding files to ./Express/dataRepresentation/schemaAssets
    fs.writeFileSync(`${__dirname}/schemaAssets/itemIDColumnLookup.json`, JSON.stringify(itemIDColumnLookup))
    console.log(chalk.whiteBright.bold(`Wrote itemIDColumnLookup.json to schemaAssets`));

    fs.writeFileSync(`${__dirname}/schemaASsets/itemParentLookup.json`, JSON.stringify(itemParentLookup))
    console.log(chalk.whiteBright.bold(`Wrote itemParentLookup.json to schemaAssets`));

    fs.writeFileSync(`${__dirname}/schemaAssets/featureItemLookup.json`, JSON.stringify(featureItemLookup));
    console.log(chalk.whiteBright.bold(`Wrote featireItemLookup.json to schemaAssets`));

    fs.writeFileSync(`${__dirname}/schemaAssets/itemRealGeoLookup.json`, JSON.stringify(itemRealGeoLookup));
    console.log(chalk.whiteBright.bold(`Wrote itemRealGeoLookup.json to schemaAssets`));
    
    fs.writeFileSync(`${__dirname}/schemaAssets/allItems.json`, JSON.stringify(await db.many(allItems)));
    console.log(chalk.whiteBright.bold(`Wrote allItems.json to schemaAssets`));    
}

async function showComputed(commandLineArgs) {
    // Creating the computed file and returnables folder 
    if(commandLineArgs.showComputed === true) {
       console.log(chalk.whiteBright.bold(`Writing returnables to the ${commandLineArgs.schema} folder`));

       fs.mkdirSync(__dirname + '/auditSchemas/' + commandLineArgs.schema + '/returnables', {recursive: true})
       console.log(chalk.whiteBright.bold(`Made the 'returnables' directory for auditSchemas/${commandLineArgs.schema}`));

       let currentReturnables = await db.many(getReturnables);
       currentReturnables = JSON.stringify(currentReturnables);

       // writing the JSON
       fs.writeFileSync(`${__dirname}/auditSchemas/${commandLineArgs.schema}/returnables/computedAt-${Date.now()}.json`, currentReturnables);
       console.log(chalk.whiteBright.bold(`Wrote computedAt-${Date.now()}.json in the 'returnables' directory for auditSchemas/${commandLineArgs.schema}`));
    }   
}

   
