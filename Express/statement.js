const pgp = require("pg-promise");
const PS = pgp.PreparedStatement;
let join = {}; //at the end we will put all the variables inside this JS object, but for now just write them all as seperate variable declarations
 
// Select and Where clauses //
const select = {
    query: 'SELECT $(returnColumns:name) FROM $(feature:name)'
};

const where = { // ex: {clause: 'AND', filter: "item_sop.sop_name", operation: "=", value: "Example SOP #1"}
    query: '$(clause:value) $(filterColumns:value) $(operation:value) $(value:value)' 
};

// Column map //

/*
let columnMap = {
    flushometer_condition_name: ''
    flushometer_brand_name:
    basin_condition_name:
    basin_brand_name:
    stall_condition_name:
    sensor_condition_name:
    room_number:
    building_name:
    building_community_name:
}
date_submitted, template_name, sop_name, organization_name

let columnMap = {
    toilet : ['gpf','commentary','date_conducted'],
    audit : ['date_submitted'],
    toilet_s_c : 
}
*/
// New Query Format

let loc = {
    query: 'LEFT JOIN loc ON $(feature:value).location_id = loc.location_id',
    dependencies: []
};

let item_sop = {
    query: 'INNER JOIN item_sop ON audit_submission.sop_id = item_sop.sop_id',
    dependencies: ['audit_submission']
};

let newQueryFormatTemplate = {
    query: '',
    dependencies: []
};

// table joins for toilet location columns and toilet audit submission columns
// Left join for room and regions (null in location tables)
// room_number
let item_room = {
    query:'INNER JOIN item_room ON loc.room_id = item_room.room_id',
    dependencies: ['loc']
}

// building_name
let item_building = {
    query: 'INNER JOIN item_building ON item_room.building_id = item_building.building_id',
    dependencies: ['item_room', 'loc']
}

// building_community_name
let item_community = {
    query: 'INNER JOIN loc ON loc.location_id = item_community.community_id',
    dependencies: ['item_building', 'item_room', 'loc']
}


// date_submitted -- unsure
let audit_submission = {
    query: 'LEFT JOIN audit_submission ON $(feature:value).audit_id = audit_sumission.audit_id',
    dependencies: []
}


// sop_name
let item_sop = {
    query: 'INNER JOIN item_sop ON audit_submission.sop_id = item_sop.sop_id',
    dependencies: ['audit_submission']
};

// organization_name
let item_organization = {
    query: 'INNER JOIN item_organization ON audit_submission.organization_id = item_organization.organization_id',
    dependencies: ['audit_submission']
};

// template_name
let item_template = {
    query: 'INNER JOIN item_template ON audit_submission.template_id = item_template.template_id',
    // query: 'INNER JOIN item_template ON audit_submission.organization_id = item_template.organization_id',
    dependencies: ['audit_submission']
};



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