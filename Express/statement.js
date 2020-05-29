const pgp = require("pg-promise");
const PS = pgp.PreparedStatement;

 
// Select and Where clauses //
const select = {
    query: 'SELECT $(returnColumns:name) FROM $(feature:name)'
};

const where = { // ex: {clause: 'AND', filter: "item_sop.sop_name", operation: "=", value: "Example SOP #1"}
    query: '$(clause:value) $(filterColumns:value) $(operation:value) $(value:value)' 
};

let join = { //All of the table joins

/***********************************
 ** LOCATION AND AUDIT SUBMISSION **
 ***********************************/

// table joins for toilet location columns and toilet audit submission columns
// Left join for room and regions (null in location tables)

// loc
loc : {
    query: 'LEFT JOIN loc ON $(feature:value).location_id = loc.location_id',
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

// building_community_name
item_community : {
    query: 'INNER JOIN loc ON loc.location_id = item_community.community_id',
    dependencies: ['item_building', 'item_room', 'loc']
},

// date_submitted -- unsure
audit_submission : {
    query: 'LEFT JOIN audit_submission ON $(feature:value).audit_id = audit_sumission.audit_id',
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
},

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
},

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
},

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
},

/****************
 ** MIRROR M2M **
 ****************/
mirror_condition : {
    query: 'INNER JOIN mirror_condition_m2m ON audit_mirror.observation_id = mirror_condition_m2m.observation_id INNER JOIN mirror_condition ON mirror_condition_m2m.mirror_condition_id = mirror_condition.mirror_condition_id',
    dependencies: []
}

}; // END OF JOIN OBJECT

console.log(Object.keys(join))


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
    join
}; //this will export everything to the query engine 