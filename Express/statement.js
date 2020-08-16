const pgp = require("pg-promise");
const PS = pgp.PreparedStatement;


 // NEW CODE
//const {idColumnTableLookup, tableParents} = require('./setup.js');

// Inputs //

let idColumnTableLookup = {
    id: {
            column: 'column name',
            table: 'table name', 
            feature: 'feature name',
            referenceColumn: 'column name', 
            referenceTable: 'table name', //null if type_name == local
            filterable: true, //BOOLEAN
            sqlType: 'NUMERIC'|'TEXT'
        }
        //note that id is a string such as '3'
}; // if idColumnTableLookup.feature == null, it is a global table

let tableParents = {
/*  feature_toilet: null,
    subfeature_toilet_flushometer: 'feature_toilet',
    feature_urinal: 'null',
    subfeature_toilet_sensor: 'feature_toilet',
    subfeature_urinal_sensor: 'feature_urinal'
    ...
*/
    table_name: 'parent_table_name', //if root feature parent_table_name is NULL
};

let subfeatures = Object.keys(tableParents).filter(key => tableParents[key] !== null).map(key => [key, tableParents[key]]);

// iterate through subfeatures and create query for each one
// Javascript template literal syntax

let subfeatureJoin = {
    subfeatures[0]: {
        query: 'INNER JOIN $(subfeature[1]) ON $(subfeature[1]).table_id = $(subfeature[0]).parent_id',
        dependencies: [subfeature[1]]
    }
};

// every feature has a feature item, but not every subfeature has a feature item
let featureItemJoin = {
    feature: {
        if (subfeatures.map(subfeature => subfeature[0]).includes($(feature))) { // if feature is actually a subfeature
            query: 'INNER JOIN featureitem_$(feature) ON featureitem_$(feature).featureitem_id = subfeature_$(feature).featureitem_id'
        } else { // if feature is already top-level feature; every feature has a feature item, so this is the default
            query: 'INNER JOIN featureitem_$(feature) ON featureitem_$(feature).featureitem_id = feature_$(feature).featureitem_id'
        }
    }
};


// get all unique tables and features (if not null) from idColumnTableLookup
// not sure if the syntax for this is correct, particularly due to the part inside the brackets
var tablesAndFeatures = new Set(idColumnTableLookup[id]);

// Feature //
/*

!!!
Feature, subfeature, and featureitem tables are joined only with the table name information. So a lookup
that inputs only the names of backend tables

>Within feature or subfeature
    subfeature_... -> ... -> feature_...
    feature_... (no join)

>Featureitem
    featureitem_... -> subfeature_... (or directly) -> feature_... 

!!! Location, item, and list tables are joined with table name, reference column name, 
    and reference table name information

>Location (??)
    location_... -> featureitem_... (sometimes)

*/
let makeLocation = (locationTableName, referenceTableName, referenceColumnName) => `INNER JOIN ${locationTableName} ON ${referenceTableName}.${referenceColumnName} = ${locationTableName}.location_id`
/*
>List
    list_... -> list_m2m_... -> feature_...
*/
let listJoin = {
    feature: {
        listName_referenceTableName_referenceColumnName : { //Join m2m to audit table then join 
            query: 'INNER JOIN $(listName:value)_m2m \
                    ON $(listName:value)_m2m.observation_id = $(referenceTableName:value).$(referenceColumnName:value) \
                    INNER JOIN $(listName:value) \
                    ON $(listName:value).list_id = $(listName:value)_m2m.list_id',
            dependencies: ['referenceTableName']
        }
    }
}

/*
>Item
    item_... -> subfeature_... -> feature


*/
// Global //

// need to know foreign key and primary key 

// need to know which table references which

// Also know: What feature a table comes from or if it is global

// get all globalClauseObjects and all featureClauseObjects

// make tableNameSQLLookup from clauseObjects

//toilet: {...globalClauseObjects, ...toiletClauseObjects}


// Output

let tableNameSQLLookup = {
    feature1: { //ex: toilet and not feature_toilet
        table_name: {query: 'SQL', dependencies: []}
    }
}







// Select and Where clauses //
const select = {
    query: 'SELECT $(returnColumns:raw) FROM $(feature:name)'
};

const where = { // ex: {clause: 'AND', filter: "item_sop.sop_name", operation: "=", value: "Example SOP #1"}
    query: '$(clause:value) $(filterColumns:value) $(operation:value) $(value)' 
};

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
audit_submission : {  // note: changed to inner join
    query: 'INNER JOIN audit_submission ON $(feature:value).audit_id = audit_submission.audit_id',
    dependencies: []
},

// sop_name
item_sop : {
    query: 'INNER JOIN item_sop ON audit_submission.sop_id = item_sop.sop_id',
    dependencies: ['audit_submission']
},

// organization_name
item_organization : {
    query: 'INNER JOIN item_organization ON audit_submission.organization_id = item_organization.organization_id',
    dependencies: ['audit_submission']
},

// template_name
item_template : {
    query: 'INNER JOIN item_template ON audit_submission.template_id = item_template.template_id',
    // query: 'INNER JOIN item_template ON audit_submission.organization_id = item_template.organization_id',
    dependencies: ['audit_submission']
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

module.exports = {
    select,
    where,
    commonJoin,
    urinalJoin,
    toiletJoin,
    sinkJoin,
    mirrorJoin
}; //this will export everything to the query engine 