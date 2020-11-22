// DATABASE CONNECTION AND QUERY //
// ============================================================
// We need to query the metadata tables at the beginning of each session to get data for the setup object,
// querying, upload, and more. Everything that queries the metadata tables to recieve this information
// should go here and then the other files can import the information
// ============================================================
// pg-promise library for async database queries and promise based wrapper
// only used in this file for helpers, not querying
const pgp = require('pg-promise')();
const util = require('util');
const fs = require('fs');

// pg-native for native libpq C library bindings which we need for sync queries
const Client = require('pg-native')
const client = new Client()
// sync connecting to the database
client.connectSync('host=localhost port=5432 dbname=v4 connect_timeout=5')

/* TO DO
close the db connection!

joinPath Generation

add alias to selectSQL 

We impose that:
    no item can reference a location type more than once

test: each feature has exactly one returnableID with realGeo === true

either appendSQL and joinObject where joinObject is put through rRS and joinObject as appended
    or 

in:
    column, table, and item (to get metadata_column)
    feature to query

if location:
    columnArray.push('location_id', `${tableName}_id`)
    tableArray.push(tableName, itemTableName)

if item-list:
    samika's code

So, what do we have to do?
joinCols and joinTabs stay the same

appendSQL 
'$(inputAlias:name) <some SQL> $(outputAlias:name)'
standard:
null

selectSQL
'<some SQL> $(joinAlias:name).columnName'
standard:
'$(joinAlias:name).columnName'


// construct the joinObject based on the reference type
        {
            columns: Array,
            tables: Array,
            appendSQL: String,
            selectSQL: String
        }
        switch (col.ReferenceTypeName) {
            case 'item-id':
                // in item
                joinObject.selectSQL = pgp.as.format('a$(alias:raw).$(columnName:raw) AS $(returnableAlias:raw)', {
                    returnableAlias: returnableID,
                    columnName: col.columnName
                });
                break;
            case 'item-non-id':
                // in item 
                joinObject.selectSQL = pgp.as.format('a$(alias:raw).$(columnName:raw)', {
                    alias: returnableID,
                    columnName: col.columnName
                });
                break;
            case 'item-list':
                // list
                joinObject.selectSQL = pgp.as.format('a$(listTableName:raw).$(columnName:raw)', {
                    listTableName: col.tableName,
                    columnName: col.columnName
                });
                // needs custom SQL for join
                appendSQL = pgp.as.format('INNER JOIN m2m_$(listTableName:raw) \
                                        ON m2m_$(listTableName:raw).item_id = $(alias:raw).item_id \
                                        INNER JOIN $(listTableName:raw) \
                                        ON $(listTableName:raw).list_id = m2m_$(listTableName:raw).list_id', {
                    listTableName: col.tableName, 
                    alias: returnableID
                })
                break;
            case 'item-location':
                joinObject.selectSQL = pgp.as.format('a$(locationTableName:raw).$(columnName:raw)', {
                    locationTableName: ,
                    columnName: col.columnName
                });
                break;
            case 'item-factor':
                break;
            case 'obs':
                break;
            case 'obs-global':
                break;
            case 'obs-list':
                break;
            case 'obs-factor':
                break;
            case 'special':
                break;
            case 'attribute':
                break;
        }







*/


// QUERIES //
// ==================================================

let returnableQuery = client.querySync('SELECT \
                                        \
                                        f.table_name as f__table_name, f.num_feature_range as f__num_feature_range, f.information as f__information, \
                                        f.frontend_name as f__frontend_name, \
                                        \
                                        rf.table_name as rf__table_name, \
                                        \
                                        c.column_id as c__column_id, c.frontend_name as c__frontend_name, c.column_name as c__column_name, c.table_name as c__table_name, \
                                        c.observation_table_name as c__observation_table_name, c.subobservation_table_name as c__subobservation_column_name, \
                                        c.information as c__information, c.is_nullable as c__is_nullable, c.is_default as c__is_default, c.accuracy as c__accuracy, \
                                        \
                                        fs.selector_name as fs__selector_name, \
                                        ins.selector_name as ins__selector_name, \
                                        sql.type_name as sql__type_name, \
                                        rt.type_name as rt__type_name, \
                                        ft.type_name as ft__type_name, ft.type_description as ft__type_description, \
                                        \
                                        r.returnable_id as r__returnable_id, r.frontend_name as r__frontend_name, r.is_used as r__is_used, r.join_object as r__join_object, \
                                        r.is_real_geo as r__is_real_geo, r.join_object -> \'attributeType\' as r__attribute_type, r.feature_id as r__feature_id, \
                                        \
                                        i.table_name as i__table_name, i.frontend_name as i__frontend_name \
                                        \
                                        FROM metadata_returnable as r \
                                        LEFT JOIN metadata_column AS c ON c.column_id = r.column_id \
                                        LEFT JOIN metadata_feature AS f ON r.feature_id = f.feature_id \
                                        LEFT JOIN metadata_feature AS rf ON r.rootfeature_id = rf.feature_id \
                                        LEFT JOIN metadata_selector AS fs ON c.filter_selector = fs.selector_id \
                                        LEFT JOIN metadata_selector AS ins ON c.input_selector = ins.selector_id \
                                        LEFT JOIN metadata_sql_type AS sql ON c.sql_type = sql.type_id \
                                        LEFT JOIN metadata_reference_type AS rt ON c.reference_type = rt.type_id \
                                        LEFT JOIN metadata_item AS i ON c.metadata_item_id = i.item_id \
                                        LEFT JOIN metadata_frontend_type AS ft ON c.frontend_type = ft.type_id');


let columnQuery = client.querySync('SELECT \
                                    \
                                    c.column_id as c__column_id, c.frontend_name as c__frontend_name, c.column_name as c__column_name, c.table_name as c__table_name, \
                                    c.observation_table_name as c__observation_table_name, c.subobservation_table_name as c__subobservation_column_name, \
                                    c.information as c__information, c.is_nullable as c__is_nullable, c.is_default as c__is_default, c.accuracy as c__accuracy, \
                                    \
                                    fs.selector_name as fs__selector_name, \
                                    ins.selector_name as ins__selector_name, \
                                    sql.type_name as sql__type_name, \
                                    rt.type_name as rt__type_name, \
                                    ft.type_name as ft__type_name, ft.type_description as ft__type_description, \
                                    \
                                    i.table_name as i__table_name, i.frontend_name as i__frontend_name \
                                    \
                                    FROM metadata_column as c \
                                    LEFT JOIN metadata_selector AS fs ON c.filter_selector = fs.selector_id \
                                    LEFT JOIN metadata_selector AS ins ON c.input_selector = ins.selector_id \
                                    LEFT JOIN metadata_sql_type AS sql ON c.sql_type = sql.type_id \
                                    LEFT JOIN metadata_reference_type AS rt ON c.reference_type = rt.type_id \
                                    LEFT JOIN metadata_item AS i ON c.metadata_item_id = i.item_id \
                                    LEFT JOIN metadata_frontend_type AS ft ON c.frontend_type = ft.type_id');

let allItems = client.querySync('SELECT i.table_name as i__table_name, i.frontend_name as i__frontend_name, t.type_name as t__type_name, \
                                 i.creation_privilege as i__creation_privilege, i.item_id as i__item_id \
                                 FROM metadata_item AS i \
                                 LEFT JOIN metadata_item_type AS t ON i.item_type = t.type_id');

let itemM2M = client.querySync('SELECT i.table_name as i__table_name, i.frontend_name as i__frontend_name, t.type_name as t__type_name, \
                                i.creation_privilege as i__creation_privilege, \
                                m2m.is_id as m2m__is_id, m2m.is_nullable as m2m__is_nullable, m2m.frontend_name as m2m__frontend_name, \
                                ri.table_name as ri__table_name \
                                FROM metadata_item AS i \
                                LEFT JOIN metadata_item_type AS t ON i.item_type = t.type_id \
                                INNER JOIN m2m_metadata_item AS m2m ON m2m.item_id = i.item_id \
                                INNER JOIN metadata_item AS ri ON m2m.referenced_item_id = ri.item_id');

let frontendTypes = client.querySync('SELECT type_name FROM metadata_frontend_type');

let allFeatures = client.querySync('SELECT f.table_name as f__table_name, f.num_feature_range as f__num_feature_range, f.information as f__information, \
                                    f.frontend_name as f__frontend_name, ff.table_name as ff__table_name, \
                                    i.table_name as i__table_name, i.frontend_name as i__frontend_name \
                                    FROM metadata_feature AS f \
                                    LEFT JOIN metadata_feature as ff ON f.parent_id = ff.feature_id \
                                    LEFT JOIN metadata_item as i ON f.observable_item_id = i.item_id');


// close the database connection
client.end();


// RETURNABLE ID CLASS
// ============================================================
class ReturnableID {
    constructor(feature, ID, columnName, columnTree, tableTree, returnType, appendSQL, selectSQL, frontendName, appendAlias) {
        this.ID = ID;
        this.feature = feature;
        this.columnName = columnName;
        this.frontendName = frontendName;
        this.returnType = returnType;
        this.appendSQL = appendSQL;
        this.selectSQL = selectSQL;
        this.appendAlias = appendAlias;

        this.joinObject = this.makeJoinObject(Array.from(columnTree), Array.from(tableTree), ID);

        Object.freeze(this);
    }

    makeJoinObject(columnTree, tableTree, ID) {
        if(columnTree === null || tableTree === null) {
            return null
        } else {
            // references must come in sets of 2
            if(tableTree.length % 2 != 0 || columnTree.length % 2 != 0) {
                throw 'Setup Error 1901: References must come in sets of 2'
            }
            let joinList = [];
            for(let n = tableTree.length; n > 1; n = n - 2) {
                joinList.push({
                    joinTable: tableTree[n-2],
                    joinColumn: columnTree[n-2],
                    originalTable: tableTree[n-1],
                    originalColumn: columnTree[n-1]
                });
            }

            let joinListArray = [];
            joinList.forEach(join => {
                joinListArray.push(`${join.originalTable}.${join.originalColumn}>${join.joinTable}.${join.joinColumn}`)
            })

            joinListArray.reverse();

            // recursiveReferenceSelection input. Note parentAlias is always input as -1 because the function
            // selects references from the feature_... table and builds out. -1 indicates a join to this table
            return {parentAlias: -1, ID: ID, refs: joinListArray}
        }
    }
}




// HOISTED FUNCTIONS //
// ============================================================

function setupQuery(returnableQuery, columnQuery, allItems, itemM2M, frontendTypes, allFeatures) {

    let returnableIDLookup = [];
    let idValidationLookup = {};
    let featureParents = {};
    let setupObject = {};

    // Format frontendTypes                         
    frontendTypes = frontendTypes.map((el) => el.type_name)

    // Order so features come before subfeatures
    let allFeaturesPreLength = allFeatures.length;
    allFeatures = [...allFeatures.filter((feature) => feature['ff__table_name'] === null), ...allFeatures.filter((feature) => feature['ff__table_name'] !== null)];
    let allFeaturesPostLength = allFeatures.length;
    // sanity check
    if(allFeaturesPostLength !== allFeaturesPreLength) {
        throw Error('Features are not partitioned correctly!')
    };
         
    // Construct setup object //
    // ============================================================
    // DOCUMENTATION SCATCH PAD
    /*
    let setupObject2 = {
        children: [[Number,...],Number], 
        subfeatureStartIndex: Number,
        items: [itemNodeObject,...],
        features: [featureNodeObject,...],
        columns: [columnObject,...],
        returnableIDToTreeID: returnableIDToTreeIDObject,
        treeIDToReturnableID: treeIDToReturnableIDObject,
        lastModified: Date
    };     

    */
    /*
    columnObject
    {
        “default”: Bool,
        “frontendName”: String,
        “filterSelector”: selectorObject|NULL,
        “inputSelector”: selectorObject|NULL,
        “datatype”: datatypeObject,
        “nullable”: Bool,
        “information”: String,
        //“isGroundTruth”: true|false
        “accuracy”: Number
    }
    */
    


    const datatypeArray = ['hyperlink', 'string', 'bool', 'date', 'location'];

    // Construct columnObjects
    // ==================================================
    const columnOrder = columnQuery.map(row => row['c__column_id']);

    let columnObjects = columnQuery.map((row, i) => {

        // filterSelector
        let fSelector = (row['fs__selector_name'] === null ? null : {selectorKey: row['fs__selector_name'], selectorValue: null})

        // inputSelector
        let iSelector = (row['ins__selector_name'] === null ? null : {selectorKey: row['ins__selector_name'], selectorValue: null})

        // datatype
        let datatype = datatypeArray.indexOf(row['ft__type_name'])
        
        return(
            {
                additionalInfo: {
                    observation: row['c__observation_table_name'],
                    subobservation: row['c__subobservation_table_name'],
                    item: row['i__table_name'],
                    columnID: row['c__column_id'],
                    columnName: row['c__column_name'],
                    tableName: row['c__table_name'],
                    referenceType: row['rt__type_name'],
                    columnID: row['c__column_id']
                },
                object: {
                    default: row['c__is_default'],
                    frontendName: row['c__frontend_name'],
                    filterSelector: fSelector,
                    inputSelector: iSelector,
                    datatype: datatype,
                    nullable: row['c__is_nullable'],
                    information: row['c__information'],
                    accuracy: row['c__accuracy']
                }
            }
        );
    });
    // Construct itemNodeObject
    // ==================================================

// INFO: item information does not exist right now

    const itemOrder = allItems.map(row => row['i__table_name']);

    
    let itemNodeObjects = allItems.map(item => {

        // getting non-id columns
        const nonIDColumns = columnObjects.filter(col => col.additionalInfo.item === item['i__table_name'] && ['item-non-id', 'item-list', 'item-location', 'item-factor'].includes(col.additionalInfo.referenceType));

        // non-id column indices
        const nonIDColumnIndices = nonIDColumns.map(col => columnOrder.indexOf(col.additionalInfo.columnID));

        // getting id columns
        const IDColumns = columnObjects.filter(col => col.additionalInfo.item === item['i__table_name'] && ['item-id'].includes(col.additionalInfo.referenceType));

        // id column indices
        const IDColumnIndices = IDColumns.map(col => columnOrder.indexOf(col.additionalInfo.columnID));

        // itemNodePointerObject
        // get parentIndex
        // filter on item table name = referencing table name
        let itemParents = itemM2M.filter(m2m => m2m['i__table_name'] === item['i__table_name']);
        // get referenced item indices
        let itemChildNodePointerObjects = itemParents.map(e => {
            let itemParentIndex = itemOrder.indexOf(e['ri__table_name']);

            // get frontendName
            let frontendName = e['m2m__frontend_name'];

            // get nullable
            let nullable = e['m2m__is_nullable'];

            // get information
            let information = e['m2m__information'];
// INFO: information is null now, Kian needs to add

            // get isID
            let isID = e['m2m__is_id'];

            return({
                object: {
                    index: itemParentIndex,
                    frontendName: frontendName,
                    nullable: nullable,
                    information: information
                },
                isID: isID
            })
        })
        
        // filter by ID = true and map to object
        let IDitemChildNodePointerObjects = itemChildNodePointerObjects.filter(obj => obj.isID === true).map(obj => obj.object);

        // filter by ID = false and map to object
        let nonIDitemChildNodePointerObjects = itemChildNodePointerObjects.filter(obj => obj.isID === false).map(obj => obj.object);

        return ({
            children: [IDColumnIndices, IDitemChildNodePointerObjects, nonIDColumnIndices, nonIDitemChildNodePointerObjects],
            frontendName: item['i__frontend_name'],
            information: null
        });
    });

    let submissionItemIndex = itemOrder.indexOf('item_submission');

    

    // Construct featureNodeObject
    // ==================================================
    let rootFeatures = allFeatures.map((el) => [el['f__table_name'], el['ff__table_name']]).filter((el) => el[1] === null).map((el) => el[0])

    let parentSubfeatureLookup = {};

    let featureOrder = allFeatures.map((feature) => feature['f__table_name'])

    rootFeatures.forEach((el) => {
        parentSubfeatureLookup[el] = [];
    })

    // add subfeatures to the property in parentSubfeatureLookup of their parent feature
    allFeatures.map((el) => [el['f__table_name'], el['ff__table_name']]).forEach((el) => {
        if(el[1] !== null) {
            parentSubfeatureLookup[el[1]].push(el[0])
        }
    })

    let featureNodeObjects = allFeatures.map((el) => {

        let frontendName = el['f__frontend_name']
        let information = el['f__information']
        let numFeatureRange = el['f__num_feature_range'] 

        // get array of children
        let directChildren = (el['ff__table_name'] === null ? parentSubfeatureLookup[el['f__table_name']] : [])
        // get indicies
        directChildren = directChildren.map((child) => featureOrder.indexOf(child))

        // observation columns
        // filter on observable reference type and column item matching feature item
        let observationColumns = columnObjects.filter(e => ['obs', 'obs-list', 'obs-factor', 'obs-global', 'special'].includes(e.additionalInfo.referenceType) && el['i__table_name'] === e.additionalInfo.item);

        // observation column indicies
        let observationColumnIndices = observationColumns.map(col => columnOrder.indexOf(col.additionalInfo.columnID));

        // attribute columns
        // filter on attribute reference type and column item matching feature item
        let attributeColumns = columnObjects.filter(e => ['attribute'].includes(e.additionalInfo.referenceType) && el['i__table_name'] === e.additionalInfo.item);

        // attribute column indicies
        let attributeColumnIndices = attributeColumns.map(col => columnOrder.indexOf(col.additionalInfo.columnID));

        // observable item
        let observableItem = el['i__table_name'];

        // observable item index
        let observableItemIndex = itemOrder.indexOf(observableItem);

// INFO: numFeatureRange is commented out
        return({
            children: [observationColumnIndices, attributeColumnIndices, observableItemIndex],
            frontendName: frontendName,
            information: information,
            // numFeatureRange: numFeatureRange,
            featureChildren: directChildren
        })
    })

    let featureIndices = featureOrder.map((e, i) => i);
    
    // Construct returnableIDToTreeID and treeIDToReturnableID
    // ==================================================

    // init
    let returnableIDToTreeIDObject = {};
    let treeIDToReturnableIDObject = {};

    // init statics
    const statics = {
        featureIndices,
        featureNodeObjects,
        featureOrder,
        itemNodeObjects,
        itemOrder,
        columnObjects,
        columnOrder
    };

    // adding each returnable to the objects
    returnableQuery.forEach(returnable => {
        // calling tree creation function
        // note: this function calls itemReturnableMapper and featureReturnableMapper
        let idTreeObject = initialReturnableMapper(returnable, statics);

        // add to returnableIDToTreeIDObject
        returnableIDToTreeIDObject[String(idTreeObject.returnableID)] = idTreeObject.treeID.join('>');

        // add to treeIDToReturnableIDObject
        treeIDToReturnableIDObject[idTreeObject.treeID.join('>')] = idTreeObject.returnableID;
    });


    // Constructing the final setupObject
    // ==================================================

    setupObject.children = [featureIndices, submissionItemIndex];
    setupObject.subfeatureStartIndex = allFeatures.map((feature) => (feature['ff__table_name'] === null ? false : true)).indexOf(true); // indexOf takes first index to match
    setupObject.items = itemNodeObjects;
    setupObject.features = featureNodeObjects;
    setupObject.columns = columnObjects.map(obj => obj.object);
    setupObject.datatypes = datatypeArray;
    setupObject.returnableIDToTreeID = returnableIDToTreeIDObject;
    setupObject.treeIDToReturnableID = treeIDToReturnableIDObject;
    setupObject.lastModified = Date.now();
    // yay


    // Construct idValidationLookup
    // ============================================================
                        
    for(let row of returnableQuery) {

        let id = row['r__returnable_id'].toString();

        let isFilterable = (row['fs__selector_name'] === null ? false : true);

        let isSubmission = (row['r__feature_id'] === null ? true : false);

        idValidationLookup[id] = {
            // feature and root feature
            rootfeature: row['rf__table_name'],
            feature: row['f__table_name'],
            //referenceColumn: row['c__reference_column_name'],
            //referenceTable: row['c__reference_table_name'],

            isFilterable: isFilterable,
            isSubmission: isSubmission,

            sqlType: row['sql__type_name'],
            //groundTruthLocation: row['c__is_ground_truth']
        }
    }


    
    // Construct featureParents
    // ============================================================
    allFeatures.map((el) => [el['f__table_name'], el['ff__table_name']]).forEach((el) => {
        featureParents[el[0]] = el[1]
    });
    
    // Construct ReturnableIDs
    // ============================================================
    
    // init custom aliases
    let listAlias = ['list_alias_', 0];
    let locationAlias = ['location_alias_', 0];
    let factorAlias = ['factor_alias_', 0];
    let attributeAlias = ['attribute_alias_', 0];


    for(let row of returnableQuery) {
        
        //  console.log(row)  //
        let selectSQL = null;
        let appendSQL = null;

        // Get feature table as string
        const feature = row['f__table_name'];

        // Get returnable id as string
        const returnableID = row['r__returnable_id'];

        // Construct returnable id alias to be used in the select clause
        //   we have to do this because aliases cannot start with numbers in SQL
        const returnableIDAlias = 'r' + returnableID

        // Get column tree
        const columnTree = row['r__join_object'].columns;
        //console.log(columnTree) 

        // Get table tree
        const tableTree = row['r__join_object'].tables;
        
        // Get return type
        const returnType = row['rt__type_name'];

        // Get data column
        const frontendName = row['r__frontend_name'];

        // Get column name and table name
        const columnName = row['c__column_name'];
        const tableName = row['c__table_name'];

        // Get attribute type (null if returnType != 'attribute')
        const attributeType = row['r__attribute_type'];

        // Writing custom SQL for all of the reference types

        // Auditor Name coalesce
        if(frontendName == 'Auditor Name' && returnType == 'special') {

            appendSQL = 'LEFT JOIN m2m_auditor ON \
                            tdg_observation_count.observation_count_id = m2m_auditor.observation_count_id \
                            INNER JOIN item_user AS user_auditor_name ON m2m_auditor.user_id = user_auditor_name.user_id';

            selectSQL = `COALESCE(${feature}.data_auditor, user_auditor_name.data_full_name)`;

        // Standard Operating Procedure
        } else if(frontendName == 'Standard Operating Procedure' && returnType == 'special') { 

            appendSQL = 'LEFT JOIN m2m_item_sop ON\
                            tdg_observation_count.observation_count_id = m2m_item_sop.observation_count_id \
                            INNER JOIN item_sop ON m2m_item_sop.sop_id = tdg_sop.sop_id'

            selectSQL = `item_sop.data_name`

        } else if(returnType == 'obs-list') {

            appendSQL = pgp.as.format('LEFT JOIN m2m_$(tableName:raw) \
                                    ON m2m_$(tableName:raw).observation_id = $(feature:name).observation_id \
                                    INNER JOIN $(tableName:name) AS $(listAlias:name) \
                                    ON $(listAlias:name).list_id = m2m_$(tableName:value).list_id', {
                                        feature: feature, 
                                        tableName: tableName,
                                        listAlias: listAlias.join('')
            });
            
            // Add STRING_AGG() here? ... yes, Oliver!
            selectSQL = pgp.as.format('STRING_AGG($(listAlias:name).$(columnName:name), \', \')', {
                listAlias: listAlias.join(''), 
                columnName: columnName,
                returnableID: returnableIDAlias
            });
            
            // add 1 to listAlias number to make a new unique alias
            listAlias[1] += 1;

        } else if(returnType == 'item-list') {

            appendSQL = pgp.as.format('LEFT JOIN m2m_$(tableName:raw) \
                                    ON m2m_$(tableName:raw).item_id = $(pgpParam:raw).item_id \
                                    INNER JOIN $(tableName:name) AS $(listAlias:name) \
                                    ON $(listAlias:name).list_id = m2m_$(tableName:value).list_id', {
                                        pgpParam: '$(alias:name)', // a little bit weird
                                        tableName: tableName,
                                        listAlias: listAlias.join('')
            });
            
            // Add STRING_AGG() here? ... yes, Oliver!
            selectSQL = pgp.as.format('STRING_AGG($(listAlias:name).$(columnName:name), \', \')', {
                listAlias: listAlias.join(''), 
                columnName: columnName,
                returnableID: returnableIDAlias
            });
            
            // add 1 to listAlias number to make a new unique alias
            listAlias[1] += 1;

        } else if(['obs', 'obs-global'].includes(returnType)) {

            appendSQL = null;

            selectSQL = pgp.as.format('$(featureTable:name).$(columnName:name)', {
                featureTable: feature,
                columnName: columnName,
                returnableID: returnableIDAlias
            });

        } else if(['item-id', 'item-non-id'].includes(returnType)) {

            appendSQL = null;

            selectSQL = pgp.as.format('$(pgpParam:raw).$(columnName:name)', {
                pgpParam: (tableName == 'item_submission' ? 'item_submission' : '$(alias:name)'),
                columnName: columnName,
                returnableID: returnableIDAlias
            });

        } else if(returnType == 'item-location') {

            let locationForeignKey = `${tableName}_id`;

            appendSQL = pgp.as.format('LEFT JOIN $(locationTable:name) AS $(locationAlias:name) \
                                       ON $(locationAlias:name).location_id = $(pgpParam:raw).$(fk:name)', {
                                            locationTable: tableName,
                                            locationAlias: locationAlias.join(''),
                                            pgpParam: '$(alias:name)',
                                            fk: locationForeignKey
                                       });

            selectSQL = pgp.as.format('$(locationAlias:name).$(columnName:name)', {
                locationAlias: locationAlias.join(''),
                columnName: columnName,
                returnableID: returnableIDAlias
            });

            // add 1 to locationAlias number to make a new unique alias
            locationAlias[1] += 1;

        } else if(returnType == 'item-factor') {

            let factorForeignKey = `${tableName}_id`;

            appendSQL = pgp.as.format('LEFT JOIN $(factorTableName:name) AS $(factorAlias:name) \
                                       ON $(factorAlias:name).factor_id = $(pgpParam:raw).$(fk:name)', {
                                           factorTableName: tableName,
                                           factorAlias: factorAlias.join(''),
                                           pgpParam: '$(alias:name)',
                                           fk: factorForeignKey
                                       });
        
            selectSQL = pgp.as.format('$(factorAlias:name).$(columnName:name)', {
                factorAlias: factorAlias.join(''),
                columnName: columnName,
                returnableID: returnableIDAlias
            });

            // add 1 to factorAlias number to make a new unique alias
            factorAlias[1] += 1;

        } else if(returnType == 'obs-factor') {

            let factorForeignKey = `${tableName}_id`;

            appendSQL = pgp.as.format('LEFT JOIN $(factorTableName:name) AS $(factorAlias:name) \
                                       ON $(factorAlias:name).factor_id = $(feature:name).$(fk:name)', {
                                           factorTableName: tableName,
                                           factorAlias: factorAlias.join(''),
                                           feature: feature,
                                           fk: factorForeignKey
                                       });
        
            selectSQL = pgp.as.format('$(factorAlias:name).$(columnName:name)', {
                factorAlias: factorAlias.join(''),
                columnName: columnName,
                returnableID: returnableIDAlias
            });

            // add 1 to factorAlias number to make a new unique alias
            factorAlias[1] += 1;

        } else if(returnType == 'attribute') {
            // current means the attribute is referenced by the item

            let attributeForeignKey = `${tableName}_id`;

            // setting item or obsevation reference depending on attribute type
            let obsOrItem = (attributeType == 'observed' ? feature : (attributeType == 'current' ? '$(alias:raw)' : null));
            if(obsOrItem === null) throw Error('Invalid attributeType');

            appendSQL = pgp.as.format('LEFT JOIN $(attributeTableName:name) AS $(attributeAlias:name) \
                                       ON $(attributeAlias:name).attribute_id = $(obsOrItem:name).$(fk:name)', {
                                           attributeTableName: tableName,
                                           attributeAlias: attributeAlias.join(''),
                                           obsOrItem: obsOrItem,
                                           fk: attributeForeignKey
                                       });

            selectSQL = pgp.as.format('$(tableName:raw).$(columnName:name)', {
                tableName: attributeAlias.join(''),
                columnName: columnName
            });

            // add 1 to attributeAlias number to make a new unique alias
            attributeAlias[1] += 1;

        } else {
            throw Error('Returnable did not match to a valid return type')
        }

        // Add returnableID to the lookup with key = id
        returnableIDLookup.push(new ReturnableID(feature, returnableID, columnName, columnTree, tableTree, returnType, appendSQL, selectSQL, frontendName))

    }

    
    return({
        setupObject: setupObject,
        idValidationLookup: idValidationLookup,
        featureParents: featureParents,
        returnableIDLookup: returnableIDLookup
    })
}


const featureReturnableMapper = (returnable, currentPath, treeArray, statics) => {
    // destructure statics
    const {
        featureIndices,
        featureNodeObjects,
        featureOrder,
        itemNodeObjects,
        itemOrder,
        columnObjects,
        columnOrder
    } = statics;
    // if observation returnable
    if(['obs', 'obs-list', 'obs-factor', 'obs-global', 'special'].includes(returnable['rt__type_name'])) {
        // sanity check
        if(currentPath.length !== 0) throw Error(`ReturnableID: ${returnable['r__returnable_id']} is an observation returnable but has a non zero length joinObject.tables`)
        // push observationColumns index
        treeArray.push(0);
        // get columnID of columnObject of returnable
        let columnObjectID = columnObjects.filter(obj => obj.additionalInfo.columnID === returnable['c__column_id']).map(obj => obj.additionalInfo.columnID);
            // sanity check
            if(columnObjectID.length !== 1) throw Error(`Returnable with ID: ${returnable['r__returnable_id']} did not match to one column`);
        // get columnObject index
        let columnObjectIndex = columnOrder.indexOf(columnObjectID[0]);
        // get feature index
        let featureIndex = featureOrder.indexOf(returnable['f__table_name'])
        // get index of columnObject index
        let indexOfColumnObjectIndex = featureNodeObjects[featureIndex].children[0].indexOf(columnObjectIndex);
        // push index to tree
        treeArray.push(indexOfColumnObjectIndex);
        // finish
        return({
            returnableID: returnable['r__returnable_id'],
            treeID: treeArray,
            isDefault: returnable['r__is_used']
        })
    } else if(['attribute'].includes(returnable['rt__type_name'])) { // if attribute returnable
        // push attributeColumns index
        treeArray.push(1);
        // get columnID of columnObject of returnable
        let columnObjectID = columnObjects.filter(obj => obj.additionalInfo.columnID === returnable['c__column_id']).map(obj => obj.additionalInfo.columnID);
            // sanity check
            if(columnObjectID.length !== 1) throw Error(`Returnable with ID: ${returnable['r__returnable_id']} did not match to one column`);
        // get columnObject index
        let columnObjectIndex = columnOrder.indexOf(columnObjectID[0]);
        // get feature index
        let featureIndex = featureOrder.indexOf(returnable['f__table_name'])
        // get index of columnObject index
        let indexOfColumnObjectIndex = featureNodeObjects[featureIndex].children[1].indexOf(columnObjectIndex);
        // push index to tree
        treeArray.push(indexOfColumnObjectIndex);
        // finish
        return({
            returnableID: returnable['r__returnable_id'],
            treeID: treeArray,
            isDefault: returnable['r__is_used']
        })
    } else { // then not an observation or attribute returnable
        // push to tree
        treeArray.push(2);
        // remove observation_... -> item_... from path
        currentPath.splice(0, 2)
        // calling itemReturnableMapper
        return itemReturnableMapper(returnable, currentPath, treeArray, statics);
    }
}


const itemReturnableMapper = (returnable, currentPath, treeArray, statics) => {
    // destructure statics
    const {
        featureIndices,
        featureNodeObjects,
        featureOrder,
        itemNodeObjects,
        itemOrder,
        columnObjects,
        columnOrder
    } = statics;
    // if returnable is within item
    if(currentPath.length == 0) {
        // if id-column
        if(['item-id'].includes(returnable['rt__type_name'])) {
            // push the idColumn index
            treeArray.push(0);
             // get columnID of columnObject of returnable
            let columnObjectID = columnObjects.filter(obj => obj.additionalInfo.columnID === returnable['c__column_id']).map(obj => obj.additionalInfo.columnID);
                // sanity check
                if(columnObjectID.length !== 1) throw Error(`Returnable with ID: ${returnable['r__returnable_id']} did not match to one column`);
            // get columnObject index
            
            let columnObjectIndex = columnOrder.indexOf(columnObjectID[0]);
            /////////////////////////////////////console.log(columnObjectIndex);

            // get item index
            let itemIndex = itemOrder.indexOf(returnable['i__table_name']);
            // get index of columnObject index
            let indexOfColumnObjectIndex = itemNodeObjects[itemIndex].children[0].indexOf(columnObjectIndex);
            //////////////////////////////////////console.log(itemNodeObjects[itemIndex].children[0][0] + ' >>>>> ' + columnObjectIndex);
            
            // push index to tree
            treeArray.push(indexOfColumnObjectIndex);
            // finish
            return({
                returnableID: returnable['r__returnable_id'],
                treeID: treeArray,
                isDefault: returnable['r__is_used']
            })
        } else if(['item-non-id', 'item-list', 'item-location', 'item-factor'].includes(returnable['rt__type_name'])) {
            // push the idColumn index
            treeArray.push(2);
             // get columnID of columnObject of returnable
            let columnObjectID = columnObjects.filter(obj => obj.additionalInfo.columnID === returnable['c__column_id']).map(obj => obj.additionalInfo.columnID);
                // sanity check
                if(columnObjectID.length !== 1) throw Error(`Returnable with ID: ${returnable['r__returnable_id']} did not match to one column`);
            // get columnObject index
            let columnObjectIndex = columnOrder.indexOf(columnObjectID[0]);
            // get item index
            let itemIndex = itemOrder.indexOf(returnable['i__table_name']);
            // get index of columnObject index
            let indexOfColumnObjectIndex = itemNodeObjects[itemIndex].children[2].indexOf(columnObjectIndex);
            // push index to tree
            treeArray.push(indexOfColumnObjectIndex);
            // finish
            return({
                returnableID: returnable['r__returnable_id'],
                treeID: treeArray,
                isDefault: returnable['r__is_used']
            })
        } else {
            throw Error('This shouldn\'t happen... uwu')
        }
    } else { // then returnable is not in item
        let fromItem = currentPath[0];
        let toItem = currentPath[1];
        //////////////////////////////////////////////console.log(fromItem, toItem)
        // remove item_... -> item_... from path
        currentPath.splice(0, 2);
        // get isID based on the itemM2M
        let isID = itemM2M.filter(m2m => m2m['i__table_name'] === fromItem && m2m['ri__table_name'] === toItem).map(m2m => m2m['m2m__is_id']);
        // sanity check
        if(isID.length !== 1) throw Error(`ReturnableID: ${returnable['r__returnable_id']} did not match to one item to item relation`);
        // if isID
        if(isID[0] === true) {
            // add index to tree
            treeArray.push(1);
            // get item index
            let itemIndex = itemOrder.indexOf(fromItem);
            // get referenced item index
            let parentItemIndex = itemOrder.indexOf(toItem);
            // get itemNodeObject
            let itemNodeObject = itemNodeObjects[itemIndex];
            // get itemNodeObject nonID itemChildNodePointerObjects
            let nonIDPointerObjects = itemNodeObject.children[1];
            // get index of relevant itemChildNodePointerObject
            let pointerIndex = nonIDPointerObjects.map(e => e.index).indexOf(parentItemIndex);
            // add index to tree
            treeArray.push(pointerIndex);
            // call recursively
            return itemReturnableMapper(returnable, currentPath, treeArray, statics);
        } else {
            // add index to tree
            treeArray.push(3);
            // get item index
            let itemIndex = itemOrder.indexOf(fromItem);
            // get referenced item index
            let parentItemIndex = itemOrder.indexOf(toItem);
            // get itemNodeObject
            let itemNodeObject = itemNodeObjects[itemIndex];
            ///////////console.log(itemNodeObject)
            /////////////console.log(returnable)
            // get itemNodeObject nonID itemChildNodePointerObjects
            let nonIDPointerObjects = itemNodeObject.children[3];
            ////////console.log(nonIDPointerObjects)
            // get index of relevant itemChildNodePointerObject
            let pointerIndex = nonIDPointerObjects.map(e => e.index).indexOf(parentItemIndex);
            // add index to tree
            treeArray.push(pointerIndex);
            // call recursively
            return itemReturnableMapper(returnable, currentPath, treeArray, statics);
        };
    };
};


const initialReturnableMapper = (returnable, statics) => {
    // destructure statics
    const {
        featureIndices,
        featureNodeObjects,
        featureOrder,
        itemNodeObjects,
        itemOrder,
        columnObjects,
        columnOrder
    } = statics;
    // init treeArray
    let treeArray = [];
    // set current path to joinObject tables
    //console.log(returnable)
    //console.log(returnable['r__join_object'])
    let currentPath = Array.from(returnable['r__join_object'].tables);

    // if submission
    if(returnable['f__table_name'] === null) {
        treeArray.push(1);
        // get index of item_submission
        // let referencedItemIndex = itemOrder.indexOf('item_submission');
        // push index to treeArray
        // treeArray.push(referencedItemIndex);
        // calling itemReturnableMapper
        return itemReturnableMapper(returnable, currentPath, treeArray, statics);
    } else {
        treeArray.push(0);
        // get feature
        let featureName = returnable['f__table_name'];
        // get index of feature
        let featureIndex = featureOrder.indexOf(featureName);
        // get index of index of feature
        featureIndex = featureIndices.indexOf(featureIndex);
        // push index to treeArray
        treeArray.push(featureIndex);
        // calling featureReturnableMapper
        return featureReturnableMapper(returnable, currentPath, treeArray, statics)
    }
};


// CALLING SETUP FUNCTION
// ============================================================
const {returnableIDLookup, idValidationLookup, featureParents, setupObject} = setupQuery(returnableQuery, columnQuery, allItems, itemM2M, frontendTypes, allFeatures);

// SEND SETUP OBJECT
// ============================================================
const sendSetup = (req, res) => {

    let cycleTime = Date.now() - res.locals.cycleTime[0]
    console.log(`Sent setupObject in ${cycleTime} ms`)
    
    // if the "If-Modified-Since" header is not included or is newer or the same age as the setupObject's lastModified date
    if(res.locals.parsed.ifModifiedSince >= setupObject.lastModified) {

        return res.status(304) // don't send object - not modified
        
    } else { // then "If-Modified-Since" is older than setupObject's lastModified date or is something else

        // set "Last-Modified" header
        res.set('Last-Modified', setupObject.lastModified)
        // send setupObject
        return res.status(200).json(setupObject) // send setupObject
    }
}


//console.log(featureParents);
//console.log(idValidationLookup)
//console.log(returnableIDLookup.filter(el => el.appendSQL === null && el.joinObject.refs.length != 0))
//console.log(returnableIDLookup.filter(el => el.returnType == 'item-non-id'))
//console.log(setupObject)
//fs.writeFileSync(__dirname + '/setupObjectTry1.json', JSON.stringify(setupObject))
    
module.exports = {
    returnableIDLookup,
    idValidationLookup,
    featureParents,
    sendSetup,
    setupObject
}

