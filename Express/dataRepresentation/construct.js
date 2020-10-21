// ============================================================
// This script constructs feature/subfeature tables
// and simultaneously inserts relevant metadata.
//
// TODO: referencing items that were specified
//       everything inside a transaction?
//
// ============================================================
const pgp = require("pg-promise")(); // Postgres interaction
var fs = require('fs'); // Import Node.js File System
// SQL statements
const {} = require('statement.js');



// Construction CLI //
// ============================================================

// remove boilerplate argv elements
process.argv.splice(0, 2)

if(process.argv[0] == 'make-schema') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv.pop();
    // configure command line arguments
    (process.argv.includes('show-computed') ? commandLineArgs.showComputed = true : commandLineArgs.showComputed = false);
    (process.argv.includes('log') ? commandLineArgs.log = true : commandLineArgs.log = false);
    // here we go
    return makeSchema(commandLineArgs);
} else if(process.argv[0] == 'config-returnables') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv.pop();
    // configure command line arguments
    let argFile = process.argv.filter(arg => /^file=.*/.test(arg));
    if(argFile.length != 1) throw 'One file must be specified as a command line argument with \'--file=yourFile\'';
    commandLineArgs.file = argFile.match(/^file=(.*)/)[1];
    (process.argv.includes('log') ? commandLineArgs.log = true : commandLineArgs.log = false);
    // here we go
    return configureReturnables(commandLineArgs);
} else if(process.argv[0] == 'log-returnables') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv.pop();
    // here we go
    return logReturnables(commandLineArgs);
} else {
    throw Error('Not a valid construction command');
};



// High Level Functions //
// ============================================================
function makeSchema(commandLineArgs) {

    // Database Connection Setup
    // connection info
    const connection = { 
    host: 'localhost',
    port: 5432,
    database: 'meta',
    user: 'postgres',
    password: null,
    max: 5 // use up to 5 connections
    };

    // connect to postgres
    const db = pgp(connection);

    // Read schema
    let columns = readSchema(`/auditSchema/${commandLineArgs.schema}/columns.json`);
    let features = readSchema(`/auditSchema/${commandLineArgs.schema}/features.json`);

    // Call Construction Function
    await asyncConstructAuditingTables(features, columns, commandLineArgs);

    // Closing the database connection
    db.$pool.end();
}





// Generic Functions //
// ============================================================


function readSchema(file) { // Schema read function
    return JSON.parse(fs.readFileSync(__dirname + file, 'utf8'))
}



// use PROCEDURE instead of FUNCTION for PostgreSQL v10 and below
const checkAuditorNameTrigger = "CREATE TRIGGER $(tableName:value)_check_auditor_name BEFORE INSERT OR UPDATE ON $(tableName:value) \
FOR EACH ROW EXECUTE FUNCTION check_auditor_name();"

// Water //
// ==================================================




//var auditSchemaGlobal = readSchema('/auditSchema/global/globalColumns.json');

// npm run construct -- --water
// npm run construct -- --waste
// command line argument matches the folder that columns.json and features.json are in


// CALLING //
// ============================================================
/*
1. Insert features into metadata_feature,
    create feature_..., subfeature_..., and item_... tables (auditing tables)
2. Add foreign key constraints for auditing tables

3. Insert columns into metadata_column and add data_... columns
4. Add foreign key constraints for data_... columns
5. Add local-global and special columns into metadata_column for every feature

Proposed New Steps:
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

/*

3.  in: returnableInput

Problem
    attributes make there a single metadata_column map to two returnables within a feature


constraint: no item can reference another item more than once
            lists are always nullable
            item cannot reference same location type more than once
            attributes are always non nullable
            lists and factors are specific to one item or observation table


Finding returnables
1. start at feature and go to corresponding observable item
2. find all data columns for that item
3. go to that item's referenced items and go back to step 2

repeats:
    attribute
    data column referenced more than once within a feature tree


let returnableTreeObject = {
    features: [],
    returnables:
    [[{
        itemLineage: [item1, item2, item3],
        returnableID: 8,
        columnIndex: 2
    }, {}], [], []]
}




keys:
    feature
    item

returnable inherits column's frontendName unless specialName: <> is specified

What must be changed
- metadata_column
- metadata_feature
- featureInput
- ColumnInput

generates returnables for any observable item or the submission item


SELECT table_name FROM metadata_item WHERE item_type = (SELECT type_id FROM metadata_item_type WHERE type_name = 'observable');
['item_toilet', 'item_urinal'].reduce((returnableArray, feature) => {
    return generateReturnables([feature], returnableArray)
}, [])




forEach root + submission {

    let generateReturnables(...)

}


do the gitignore

thought:
after construction into database the computed returnables file is created
and all the returnables are added

The user decided which ones to make default / send

npm run construct -- --make-schema ?-show-computed ?--log --water

    if there is a returnables folder it doesn't remake

npm run construct -- --config-returnables --file=config --remove --water
                        command             file   remove the file  audit schema 

config-returnables -- --config-returnables --config --water

npm run construct -- --log-returnables --water

make the returnables folder and files

*/
let ex = {
    metadataColumnID: 'a',
    featureName: 'a',
    rootFeatureName: 'a',
    joinObject: {
        columns: 'Array',
        tables: 'Array',
        appendSQL: 'String',
        selectSQL: 'String'
    },
    isRealGeo: 'a'
}

const makeItemReturnablesColumnQuery = 'SELECT c.column_id AS columnID, c.column_name AS columnName, c.table_name AS tableName, c.subobservation_table_name AS subobservationTableName, c.frontend_name AS frontendName, r.type_name AS ReferenceTypeName FROM metadata_column AS c INNER JOIN metadata_reference_type AS r ON c.reference_type = r.type_id WHERE c.metadata_item_id = (SELECT i.item_id FROM metadata_item AS i WHERE i.table_name = $(itemName))'
const makeItemReturnablesFeatureQuery = 'SELECT f.feature_id AS featureID FROM metadata_feature AS f WHERE f.table_name = $(featureName)'
const makeItemReturnablesSubobservationQuery = 'SELECT f.feature_id AS featureID FROM metadata_feature AS f WHERE f.table_name = $(subobservationTableName)'
const insert_metadata_returnable = 'SELECT "insert_metadata_returnable"($(columnID), $(featureID), $(rootFeatureID), $(frontendName), $(joinObject:json), $(isRealGeo))'

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
        columns = [],
        tables = []
    };
    let featureID;
    let isRealGeo;
    let rootFeatureID;

    // go to metadata_column and find all columns for said item
    let columns = await db.any(pgp.as.format(makeItemReturnablesColumnQuery, {
        itemName: itemObject.itemName
    }));

    // if not submission get the featureID
    if(itemObject.featureName !== null) {
        featureID = await db.one(pgp.as.format(makeItemReturnablesFeatureQuery, {
            featureName: itemObject.featureName
        })).featureID;
    }

    // construct joinObject from path
    if(itemObject.path.length > 0) {
        // sanity check
        if(itemObject.path % 2 !== 0) {
            throw 'References must come in sets of 2'
        }
        // copy tables
        joinObject.tables = Array.from(itemObject.path)
        // make columns
        for(let n = 0; n < itemObject.path.length; n += 2) {
            // push foreign key column
            joinObject.columns.push(`${itemObject.path[n+1]}_id`);
            // push primary key column
            joinObject.columns.push('item_id');
        }
    }

    // if this is not the feature's observable item we ignore all non item-... columns
    if(featureItemLookup[itemObject.featureName] !== itemObject.itemName) {
        columns = columns.filter(col => ['item-id', 'item-non-id', 'item-list', 'item-location', 'item-factor', 'attribute'].includes(col))
    }
    
    // for each column related to the item
    columns.forEach(col => {
        // PK
        let columnID = col.columnID;
        let frontendName = col.frontendName;
        // this is lowkey kind of dumb. The attributeType is different between cols so we can't
        // mutate the base joinObject. I'm sure there's a better way.
        let insertableJoinObject = {
            columns: joinObject.columns,
            tables: joinObject.tables,
            attributeType: null
        };

        // if not submission
        if(itemObject.featureName !== null) {
            // is it the realGeo column?
            let itemRealGeo = itemRealGeoLookup[featureItemLookup[itemObject.featureName]];
            // if it passes the identifying conditions, then it is the real geo
            if(itemRealGeo.itemName == itemObject.itemName && itemRealGeo.tableName == col.tableName && itemRealGeo.columnName == col.columnName) {
                isRealGeo = true;
            }

            // if subobservation
            if(col.subobservationTableName !== null) {
                rootFeatureID = featureID;
                featureID = await db.one(pgp.as.format(makeItemReturnablesSubobservationQuery, {
                    subobservationTableName: col.subobservationTableName
                })).featureID;
            } else {
                // else then feature is already root
                rootFeatureID = null;
            }

        } else { // else then submission and no feature or geo information
            isRealGeo = false;
            featureID = false;
            rootFeatureID = false;
        }

        // attribute edge case where one column maps to 2 returnables
        if(col.ReferenceTypeName === 'attribute') {
            // if this is not the feature's observable item we only use 'current' attribute
            if(featureItemLookup[itemObject.featureName] !== itemObject.itemName) {

                // set attribute type
                insertableJoinObject.attributeType = 'current';
                // make valid JSON
                let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

                // insert returnable into metadata_returnable and get returnableID
                let returnableID = await db.one(pgp.as.format(insert_metadata_returnable, {
                    columnID: columnID,
                    featureID: featureID,
                    rootFeatureID: rootFeatureID,
                    frontendName: 'Current ' + frontendName,
                    joinObject: insertableJoinObject_,
                    isRealGeo: isRealGeo
                })).returnableID;

                returnables.push(returnableID);
                console.log(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`);

            } else { // special case of two returnables per column

                // set attribute type
                insertableJoinObject.attributeType = 'current';
                // make valid JSON
                let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

                // insert returnable into metadata_returnable and get returnableID
                let returnableID = await db.one(pgp.as.format(insert_metadata_returnable, {
                    columnID: columnID,
                    featureID: featureID,
                    rootFeatureID: rootFeatureID,
                    frontendName: 'Current ' + frontendName,
                    joinObject: insertableJoinObject_,
                    isRealGeo: isRealGeo
                })).returnableID;

                returnables.push(returnableID);
                console.log(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`);


                // set attribute type
                insertableJoinObject.attributeType = 'observed';
                // make valid JSON
                let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

                // insert returnable into metadata_returnable and get returnableID
                let returnableID = await db.one(pgp.as.format(insert_metadata_returnable, {
                    columnID: columnID,
                    featureID: featureID,
                    rootFeatureID: rootFeatureID,
                    frontendName: 'Observed ' + frontendName,
                    joinObject: insertableJoinObject_,
                    isRealGeo: isRealGeo
                })).returnableID;

                returnables.push(returnableID);
                console.log(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`);
            }
        } else { //then not an attribute and do things normally

            // make valid JSON
            let insertableJoinObject_ = JSON.stringify(insertableJoinObject);

            // insert returnable into metadata_returnable and get returnableID
            let returnableID = await db.one(pgp.as.format(insert_metadata_returnable, {
                columnID: columnID,
                featureID: featureID,
                rootFeatureID: rootFeatureID,
                frontendName: frontendName,
                joinObject: insertableJoinObject_,
                isRealGeo: isRealGeo
            })).returnableID;

            returnables.push(returnableID);
            console.log(`Returnable Construction: ReturnableID:${returnableID} created for the ${itemObject.featureName} feature`);
        }
        
    });

    return returnables;
}

let itemArray = [
    {
        featureName: 'observation_sink',
        itemName: 'item_sink',
        path: []
    }
];

/* generateReturnables (itemArray, returnableArray, itemParentLookup, itemRealGeoLookup)
============================================================
in: itemArray: Array of items to find returnables for and their paths
    returnableArray: The array of returnables found within the recursion (starts out empty)
    itemParentLookup: Static lookup object
    itemRealGeoLookup: Static lokup object

out: returnableArray: The complete array of returnableIDs
============================================================ */
function generateReturnables(itemArray, returnableArray, itemParentLookup, itemRealGeoLookup) {

    let referencedItems = [];

    // For every item in round
    itemArray.forEach(itemObject => {

        // generate returnable for every data column within or referenced by item
        let itemReturnables = makeItemReturnables(itemObject, itemRealGeoLookup)

        // add returnables to master list
        returnableArray = [...returnableArray, ...itemReturnables];

        // if item has a parent calculate new path and add to referencedItems array 
        if(itemObject.itemName in itemParentLookup) {

            let parentItemArray = itemParentLookup[itemObject.itemName]

            // for each parent item
            parentItemArray.forEach(parent => {

                // Make path with new item
                let newPath = [...itemObject.path, ...[itemObject.itemName, parent.itemName]]

                // add parent to referencedItems
                referencedItems.push({
                    featureName: itemObject.featureName,
                    itemName: parent.itemName,
                    path: newPath
                })
            })
            
        }
    })
        
    if(referencedItems.length > 0) {
        // call again with new items and pass found returnables
        return generateReturnables(referencedItems, returnableArray, itemParentLookup, itemRealGeoLookup)
    } else {
        // return all the returnables
        return returnableArray
    }
    
}

const getReturnables = 'SELECT r.returnable_id AS id, f.table_name AS feature, r.frontend_name as frontendName, r.is_used AS isUsed, r.join_object AS joinObject, r.is_real_geo AS isRealGeo \
                        FROM metadata_returnable AS r LEFT JOIN metadata_feature AS f on r.feature_id = f.feature_id'


const getItemParents = 'SELECT child.table_name AS child, parent.table_name AS parent_, m2m.is_id AS isID \
                          FROM metadata_item AS child \
                          INNER JOIN m2m_metadata_item AS m2m ON child.item_id = m2m.item_id \
                          INNER JOIN metadata_item AS parent ON m2m.referenced_item_id = parent.item_id';

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
        if(!(rel.child in itemParents)) {
            itemParents[rel.child] = [];
        } 
        itemParents[rel.child].push({itemName: rel.parent_, isID: rel.isID});
    });

    return itemParentLookup;
};




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
    console.log('\x1b[1m', '1. Constructing Features')

    let featureOutput = await constructFeatures2(featureSchema);
    // if there is an error in feature construction exit function
    if(featureOutput.error === true) {
        return
    }

    console.log('\x1b[1m', 'Done Constructing Features')

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
    console.log('\x1b[1m', '2. Constructing Columns');

    let columnOutput = await addDataColumns2(columnSchema, featureSchema, featureOutput.itemIDColumnLookup, featureOutput.featureItemLookup);
    // if there is an error in column construction exit function
    if(columnOutput.error === true) {
        return 
    }

    console.log('\x1b[1m', 'Done Constructing Columns');

    // Intermezzo: construct the itemParents object
    let itemParentLookup = makeItemParentLookup();

    console.log('\x1b[1m', 'Constructed the itemParents object');
    

    // Step 3.
    // Generate Returnables and insert into metadata_returnable
    // maybe get all the features from step 1 and then iterate through
    // them and call generateReturnables

    // for each root feature generate returnables
    Object.keys(featureOutput.featureItemLookup).forEach(feature => {
        console.log('\x1b[1m', `Constructing returnables for the ${feature} feature`);
        let returnables = generateReturnables(itemArray, returnableArray, itemParentLookup, featureOutput.itemRealGeoLookup);
        console.log('\x1b[1m', `Constructed IDs: ${returnables.join(', ')} for the ${feature} feature`);
    })

    // Creating the computed file and returnables folder 
    console.log('\x1b[1m', `Writing returnables to the ${commandLineArgs.schema} folder`)
    fs.mkdirSync(__dirname + 'auditSchemas/' + commandLineArgs.schema + '/returnables', {recursive: true})

    let currentReturnables = await db.many(getReturnables);
    currentReturnables = JSON.stringify(currentReturnables);

    fs.writeFileSync(`computedAt${Date.now()}.json`, currentReturnables);




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


var insert_m2m_metadata_item = 'CALL "insert_m2m_metadata_item"($(observableItem), $(referenced), $(isID), $(isNullable))';

var add_item_to_item_reference = 'SELECT "add_item_to_item_reference"($(observableItem), $(referenced), $(isID), $(isNullable))';

var insert_metadata_column = 'CALL \
"insert_metadata_column"($(columnName), $(tableName), $(observationTableName), $(subobservationTableName), $(itemTableName), $(isDefault), $(isNullable), $(frontendName), $(filterSelectorName), $(inputSelectorName), $(frontendType), $(information), $(sqlType), $(referenceType))';

var insert_metadata_feature = 'CALL "insert_metadata_feature"($(tableName), $(itemTableName), $(information), $(frontendName))';

var insert_metadata_subfeature = 'CALL "insert_metadata_subfeature"($(tableName), $(parentTableName), $(numFeatureRange), $(information), $(frontendName))';

var insert_metadata_item_observable = 'CALL "insert_metadata_item_observable"($(itemName), $(creationPrivilege))';

var create_observation_table = 'CALL "create_observation_table"($(tableName))';

var create_subobservation_table = 'CALL "create_subobservation_table"($(tableName), $(parentTableName))';

var create_observational_item_table = 'SELECT "create_observational_item_table"($(featureName))';

var add_unique_constraint = 'CALL "add_unique_constraint"($(tableName), $(uniqueOver))';

var add_data_col = 'CALL "add_data_col"($(tableName), $(columnName), $(sqlType), $(isNullable))';

var add_list = 'CALL "add_list"($(itemTableName), $(tableName), $(columnName), $(sqlType), $(isObservational))';

var add_location = 'CALL "add_location"($(itemTableName), $(locationTableName), $(isNullable))';

var add_factor = 'CALL "add_factor"($(itemTableName), $(tableName), $(columnName), $(sqlType), $(isNullable), $(isObservational))';

var add_attribute = 'CALL "add_attribute"($(itemTableName), $(tableName), $(columnName), $(sqlType))';

async function addDataColumns2(columns, features, itemIDColumnLookup, featureItemLookup) {

    // Globals
    // These data columns are defined for every feature
    columns.filter(column => column.referenceType === 'obs-global' || column.referenceType === 'special').forEach(column => {
        features.forEach(feature => {

            // insert into metadata_column
            try {
                await db.none(pgp.as.format(insert_metadata_column, {
                    columnName: column.columnName,
                    tableName: (column.tableName === null ? feature.tableName : column.tableName),
                    observationTableName: column.observationTableName,
                    subobservationTableName: column.subobservationTableName,
                    itemTableName: featureItemLookup[feature.tableName],
                    isDefault: column.isDefault,
                    isNullable: column.isNullable,
                    frontendName: column.frontendName,
                    filterSelectorName: column.filterSelectorName,
                    inputSelectorName: column.inputSelectorName,
                    frontendType: column.frontendType,
                    information: column.information,
                    sqlType: column.sqlType,
                    referenceType: column.referenceType
                }));

                console.log('\x1b[32m', `Column Construction: Inserted global column ${column.columnName} into metadata_column for ${featureItemLookup[feature.tableName]}`);
            } catch(sqlError) {
                return constructjsError(sqlError);
            }

            // if observation-global add the data column for all features
            if(column.referenceType === 'obs-global') {
                try {
                    await db.none(pgp.as.format(add_data_col, {
                        tableName: feature.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable
                    }))

                    console.log('\x1b[32m', `Column Construction: Added global column ${column.columnName} to ${feature.tableName}`);
                } catch(sqlError) {
                    return constructjsError(sqlError);
                }
            }
            
        })
        
    });

    // Standard columns (Non global)
    columns.filter(column => column.referenceType !== 'obs-global' && column.referenceType !== 'special').forEach(column => {

        // insert into metadata_column
        try {
            await db.none(pgp.as.format(insert_metadata_column, {
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
                sqlType: column.sqlType,
                referenceType: column.referenceType
            }));

            console.log('\x1b[32m', `Column Construction: Inserted column ${column.columnName} into metadata_column for ${column.itemName}`);
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
                    await db.none(pgp.as.format(add_data_col, {
                        tableName: column.tableName, // same as itemName
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable // must be false
                    }));

                    console.log('\x1b[32m', `Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`);
                    break;

                case 'item-non-id':
                    // reference type test
                    if(column.itemName !== column.tableName) {
                        throw 'item-non-id returnables must have matching table name and item name';
                    };

                    await db.none(pgp.as.format(add_data_col, {
                        tableName: column.tableName, // same as itemName
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable
                    }));

                    console.log('\x1b[32m', `Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`);
                    break;

                case 'item-list':
                    // reference type test
                    if(/^list_/.test(column.tableName) !== true) {
                        throw 'item-list returnables must be within a list_... table';
                    };
                    
                    await db.none(pgp.as.format(add_list, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isObservational: false  // false because item-list and not obs-list
                    }));

                    console.log('\x1b[32m', `Column Construction: Created ${column.tableName} tables with ${column.columnName} column for ${column.itemName}`);
                    break;

                case 'item-location':
                    // reference type test
                    if(/^location_/.test(column.tableName) !== true) {
                        throw 'item-location returnables must be within a location_... table';
                    };

                    await db.none(pgp.as.format(add_location, {
                        itemTableName: column.itemName,
                        locationTableName: column.tableName,
                        isNullable: column.isNullable
                    }));

                    console.log('\x1b[32m', `Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`);
                    break;
                    
                case 'item-factor':
                    // reference type test
                    if(/^factor_/.test(column.tableName) !== true) {
                        throw 'item-factor returnables must be within a factor_... table';
                    };
                    
                    await db.none(pgp.as.format(add_factor, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable,
                        isObservational: false  // false because item-factor and not obs-factor
                    }));

                    console.log('\x1b[32m', `Column Construction: Created ${column.tableName} table with ${column.columnName} column for ${column.itemName}`);
                    break;

                case 'obs':
                    
                    await db.none(pgp.as.format(add_data_col, {
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable
                    }));

                    console.log('\x1b[32m', `Column Construction: Added ${column.referenceType} column ${column.columnName} to ${column.itemName}`);
                    break;
                    
                case 'obs-global':

                    // This shouldn't happen!
                    throw 'Global observation columns should have been handled earlier in the function';

                case 'obs-list':
                    // reference type test
                    if(/^list_/.test(column.tableName) !== true) {
                        throw 'obs-list returnables must be within a list_... table';
                    };
                    
                    await db.none(pgp.as.format(add_list, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isObservational: true  // true because obs-list and not item-list
                    }));

                    console.log('\x1b[32m', `Column Construction: Created ${column.tableName} tables with ${column.columnName} column for ${column.itemName}`);
                    break;

                case 'obs-factor':
                    // reference type test
                    if(/^factor_/.test(column.tableName) !== true) {
                        throw 'obs-factor returnables must be within a factor_... table';
                    };
                    
                    await db.none(pgp.as.format(add_factor, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType,
                        isNullable: column.isNullable,
                        isObservational: true  // true because obs-factor and not item-factor
                    }));

                    console.log('\x1b[32m', `Column Construction: Created ${column.tableName} table with ${column.columnName} column for ${column.itemName}`);
                    break;

                case 'special':

                    // This shouldn't happen!
                    throw 'Special columns should have been handled earlier in the function';

                case 'attribute':
                    // reference type test
                    if(/^attribute_/.test(column.tableName) !== true) {
                        throw 'attribute returnables must be within an attribute_... table';
                    };
                    
                    await db.none(pgp.as.format(add_attribute, {
                        itemTableName: column.itemName,
                        tableName: column.tableName,
                        columnName: column.columnName,
                        sqlType: column.sqlType
                    }));
                    
                    console.log('\x1b[32m', `Column Construction: Created ${column.tableName} table with ${column.columnName} column for ${column.itemName}`);
                    break;

                default:
                    throw `column ${column.columnName} has an invalid reference type of ${column.referenceType}`
            }
        } catch(sqlError) {
            return constructjsError(sqlError);
        };
    });

    // Adding unique constraints
    for(let item in itemIDColumnLookup) {

        let uniqueOver = itemIDColumnLookup[item].join(', ');

        try {
            await db.none(pgp.as.format(add_unique_constraint, {
                tableName: item,
                uniqueOver: uniqueOver
            }));   
        } catch(sqlError) {
            return constructjsError(sqlError);
        }
        
        console.log('\x1b[32m', `Column Construction: Created unique constraint on ${item} over ID columns ${uniqueOver}`);
    }

    // No construction errors
    return {error: false};
}




function constructjsError(error) {
    console.log(error);
    console.log('\x1b[31m', 'CONSTRUCT.JS EXECUTION HALTED');
    return {error: true};
}

async function constructFeatures2(features) {

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
    rootFeatures.forEach(feature => {
        try {
            // Wait for item table creation and return item table name
            let item = await db.one(pgp.as.format(create_observational_item_table, {
                featureName: feature.tableName
            }));

            console.log('\x1b[32m', `Feature Construction: Observable item table created for ${feature.tableName}`);

            // make lookups
            featureItemLookup[feature.tableName] = item;
            itemIDColumnLookup[item] = [];
            itemRealGeoLookup[featureItemLookup[feature.tableName]] = feature.observableItem.realGeo;

        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    })

    // b. Insert observable items into metadata_item
    rootFeatures.forEach(feature => {
        try {
            await db.none(pgp.as.format(insert_metadata_item_observable, {
                itemName: featureItemLookup[feature.tableName],
                creationPrivilege: feature.creationPrivilege
            }));

            console.log('\x1b[32m', `Feature Construction: Inserted ${featureItemLookup[feature.tableName]} into metadata_item`);
        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    })

    // c. Add foreign key constraints for observational item tables
    // d. Insert item to item relations into m2m_metadata_item    
    rootFeatures.forEach(feature => {
        // for every required item in the feature
        feature.observableItem.requiredItem.forEach(required => {
            try {
                // c.
                let idColumn = await db.one(pgp.as.format(add_item_to_item_reference, {
                    observableItem: featureItemLookup[feature.tableName],
                    referenced: required.name,
                    isID: required.isID,
                    isNullable: required.isNullable
                }));

                itemIDColumnLookup[featureItemLookup[feature.tableName]].push(idColumn);

                console.log('\x1b[32m', `Feature Construction: ${featureItemLookup[feature.tableName]} to ${required.name} relation created`);

                // d.
                await db.none(pgp.as.format(insert_m2m_metadata_item, {
                    observableItem: featureItemLookup[feature.tableName],
                    referenced: required.name,
                    isID: required.isID,
                    isNullable: required.isNullable
                })); 

                console.log('\x1b[32m', `Feature Construction: Inserted ${featureItemLookup[feature.tableName]} to ${required.name} relation into m2m_metadata_item`);
            } catch(sqlError) {
                return constructjsError(sqlError);
            }
        })
    })

    // e. Create observation_... tables
    // f. Insert features into metadata_feature
    // filtering to get just root features
    rootFeatures.forEach(rootFeature => {
        try {
            // e.
            db.none(pgp.as.format(create_observation_table, {
                tableName: rootFeature.tableName
            }));

            console.log('\x1b[32m', `Feature Construction: Created ${rootFeature.tableName} table`);

            //f. 
            db.none(pgp.as.format(insert_metadata_feature, {
                tableName: rootFeature.tableName,
                itemTableName: featureItemLookup[rootFeature.tableName],
                information: rootFeature.information,
                frontendName: rootFeature.frontendName
            }));

            console.log('\x1b[32m', `Feature Construction: Inserted ${rootFeature.tableName} into metadata_feature`);

        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    })

    // g. Create subobservation_... tables
    // h. Insert subfeatures into metadata_feature
    // filtering to get just subfeatures
    subfeatures.forEach(subfeature => {
        try {
            // g.
            db.none(pgp.as.format(create_subobservation_table, {
                tableName: subfeature.tableName,
                parentTableName: subfeature.parentTableName
            }));

            console.log('\x1b[32m', `Feature Construction: Created ${subfeature.tableName} table`);

            // h.
            db.none(pgp.as.format(insert_metadata_subfeature, {
                tableName: subfeature.tableName,
                parentTableName: subfeature.parentTableName,
                numFeatureRange: subfeature.numFeatureRange,
                information: subfeature.information,
                frontendName: subfeature.frontendName
            }));

            console.log('\x1b[32m', `Feature Construction: Inserted ${subfeature.tableName} into metadata_item`);
        } catch(sqlError) {
            return constructjsError(sqlError);
        }
    })

    // No construction errors
    return {error: false, itemIDColumnLookup, featureItemLookup, itemRealGeoLookup};
};

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
