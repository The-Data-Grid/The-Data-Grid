// SETUP //
const pgp = require("pg-promise");
const PS = pgp.PreparedStatement;
const {db} = require('./query.js')
// END OF SETUP //

// Helper Functions //
function sqlDateConverter(date) { //converts MM-DD-YYYY to SQL preferred YYYY-MM-DD
    date = date.split('-');
    return [date[2],date[0],date[1]].join('-');
}

// Prepared Statements //
const insert_audit_submission = new PS({
    name: 'audit_submission',
    text: 'INSERT INTO audit_submission ($/columns:csv/) VALUES ($/values:csv/) RETURNING audit_id'
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

class insertAudit { //formats Audit Submission data
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

let data = {}
data.audit = new insertAudit(input.auditSubmission).insert()


// pg-promise //

// community and building must return one row, meaning that the community and building referenced in an audit must already 
// exist as an item when uploading. The room and location however, do not need to exist, so referencing a room new number or new location in an audit creates
// a new item_room with that room number in the database

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






    






function makeInsert(input) {
    for(let table in input) {

    }
}







// SAMPLE INPUT. THE INPUT WILL BE IN THIS FORMAT //
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
    data,
    item
}