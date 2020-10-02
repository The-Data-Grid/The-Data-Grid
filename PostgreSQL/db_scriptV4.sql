--------------------------------------------
---- ALL STATIC TABLES AND FOREIGN KEYS ----
--------------------------------------------

-- TABLES --

-- Location
CREATE TABLE location_point (
    location_id SERIAL PRIMARY KEY,
    data_longitude NUMERIC NOT NULL,
    data_latitude NUMERIC NOT NULL
);

CREATE TABLE location_geom_region (
    location_id SERIAL PRIMARY KEY,
    data_region JSONB NOT NULL
);

CREATE TABLE location_path (
    location_id SERIAL PRIMARY KEY,
    data_path JSONB NOT NULL
);

-- Room, Building
CREATE TABLE item_room (
    item_id SERIAL PRIMARY KEY,
    data_room_number INTEGER NOT NULL,
    item_building_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_building (
    item_id SERIAL PRIMARY KEY, 
	data_building_name TEXT NOT NULL,
    item_entity_id INTEGER, --fk **    
    location_geom_region_id INTEGER NOT NULL --fk **
);


-- Organization, Entity, City, County, State, Country

CREATE TABLE item_entity (
    item_id SERIAL PRIMARY KEY,
    data_entity_name TEXT NOT NULL,
    data_entity_address TEXT NOT NULL,
    item_city_id INTEGER NOT NULL, --fk **
    UNIQUE (data_entity_address, data_entity_name)
);

CREATE TABLE item_city (
    item_id SERIAL PRIMARY KEY,    
    data_city_name TEXT NOT NULL,
    data_population NUMERIC,
	item_county_id INTEGER NOT NULL, --fk **
    location_geom_region_id INTEGER, --fk **
    location_point_id INTEGER
);

CREATE TABLE item_county (
    item_id SERIAL PRIMARY KEY,
	data_county_name TEXT NOT NULL,
    data_fips_code NUMERIC NOT NULL UNIQUE,    
	item_state_id INTEGER NOT NULL, --fk **
    location_geom_region_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_state (
    item_id SERIAL PRIMARY KEY,
    data_state_name TEXT NOT NULL,    
    item_country_id INTEGER NOT NULL, --fk **
		location_geom_region_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_country (
    item_id SERIAL PRIMARY KEY,
    data_country_name TEXT NOT NULL,
    location_geom_region_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  
    data_organization_name_text TEXT NOT NULL,
    data_organization_name_link TEXT,
    item_entity_id INTEGER --fk **
);

-- Observation supertable, SOP and User which reference it

CREATE TABLE tdg_observation_count (
    observation_count_id SERIAL PRIMARY KEY
);

CREATE TABLE item_sop (
    sop_id SERIAL PRIMARY KEY, 
    tdg_filepath TEXT NOT NULL,
    data_name TEXT NOT NULL,
    data_time_uploaded TIMESTAMPTZ NOT NULL,
    item_organization_id INT NOT NULL --fk **
);

CREATE TABLE item_sop_m2m (
    observation_count_id INTEGER NOT NULL, --fk **
    sop_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_template (
    item_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER, --fk **
    tdg_user_id INTEGER, --fk **
    data_template_name TEXT,
    data_template_json JSONB NOT NULL
);

CREATE TABLE tdg_auditor_m2m (
    observation_count_id INTEGER NOT NULL, --fk **
    user_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_users (
    user_id SERIAL PRIMARY KEY,
    tdg_privilege_id INT NOT NULL, --fk **
    item_organization_id INT NOT NULL, --fk **
    data_first_name TEXT NOT NULL,
    data_last_name TEXT NOT NULL,
    tdg_email TEXT NOT NULL,
    tdg_p_hash TEXT NOT NULL,
    tdg_p_salt TEXT NOT NULL
);

CREATE TABLE item_privilege (
    privilege_id INT PRIMARY KEY, 
    data_privilege_name TEXT NOT NULL
);

-- Submission
CREATE TABLE item_submission (
    submission_id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL, --fk **
    item_organization_id INTEGER NOT NULL, --fk ** org that user is submitting as, id will be given by session
    user_id INTEGER NOT NULL, --fk **
    item_template_id INTEGER, --fk ** ???
    data_time_submitted TIMESTAMPTZ NOT NULL,
    data_submission_name TEXT
);

CREATE TABLE item_submission_edit (
    submission_edit_id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL, --fk
    tdg_user_id INTEGER NOT NULL, --fk
    data_time_edited TIMESTAMPTZ NOT NULL
);

CREATE TABLE tdg_assigned_auditor_m2m (
    audit_id SERIAL PRIMARY KEY, --fk **
    user_id INTEGER NOT NULL, --fk **
    user_instructions TEXT
);

CREATE TABLE tdg_catalog (
    catalog_id SERIAL PRIMARY KEY,
    data_title TEXT NOT NULL,
    data_description TEXT,
    is_discoverable BOOLEAN NOT NULL
);

CREATE TABLE tdg_audit (
    audit_id SERIAL PRIMARY KEY,
    catalog_id INTEGER, --fk **
    data_audit_name TEXT,
    user_id INTEGER NOT NULL, --fk **
    data_time_created TIMESTAMPTZ NOT NULL
);

-- Metadata --

/*
The reference type of the data_... column. Important for joining the column
as well creating the table and columns inside construct.js
*/
CREATE TABLE metadata_reference_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_reference_type
    (type_id, type_name)
    VALUES
        (DEFAULT, 'local'),
        (DEFAULT, 'local-global'),
        (DEFAULT, 'item_id'),
        (DEFAULT, 'item_non-id'),
        (DEFAULT, 'list'),
        (DEFAULT, 'special'),
        (DEFAULT, 'submission'),
        (DEFAULT, 'attribute');

/*
Two different things, data storage type, data representation type
_storage
item_id
item_non-id
local
local-global
list
special
tdg

_representation
submission


*/


/*
Type of UI data input / filtering selectors displayed in frontend
*/
CREATE TABLE metadata_selector (
    selector_id SERIAL PRIMARY KEY,
    selector_name TEXT NOT NULL
);

INSERT INTO metadata_selector 
    (selector_id, selector_name)
    VALUES
        (DEFAULT, 'numericChoice'),
        (DEFAULT, 'numericEqual'),
        (DEFAULT, 'calendarRange'),
        (DEFAULT, 'calendarEqual'),
        (DEFAULT, 'dropdown'),
        (DEFAULT, 'searchableDropdown'),
        (DEFAULT, 'checklistDropdown'),
        (DEFAULT, 'searchableChecklistDropdown'),
        (DEFAULT, 'text'),
        (DEFAULT, 'bool');

CREATE TABLE metadata_sql_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_sql_type 
    (type_id, type_name)
    VALUES
        (DEFAULT, 'TEXT'),
        (DEFAULT, 'NUMERIC'),
        (DEFAULT, 'TIMESTAMPTZ'),
        (DEFAULT, 'BOOLEAN');

CREATE TABLE metadata_frontend_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL,
    type_description TEXT NOT NULL
);

INSERT INTO metadata_frontend_type 
    (type_id, type_name, type_description)
    VALUES
        (DEFAULT, 'string', 'String display'),
        (DEFAULT, 'date', 'Date in form of MM-DD-YYYY'),
        (DEFAULT, 'hyperlink', 'When clicked open link in new page'),
        (DEFAULT, 'bool', 'Display "True" for 1 and "False" for 0'),
		(DEFAULT, 'location', 'JSONB object representing geographic location (point, path or geom region)'),
		(DEFAULT, 'integer', 'Integer'),
		(DEFAULT, 'float', 'Floating point numeric value');



/*
Query that gets all data_... columns and their respective tables:
    SELECT c.column_name, t.table_name from information_schema.tables as t inner join information_schema.columns as c on t.table_name = c.table_name WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND c.column_name LIKE 'data\_%';
*/

CREATE TABLE metadata_item_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_item_type 
    (type_id, type_name)
    VALUES
        (DEFAULT, 'observable'),
        (DEFAULT, 'potential-observable'),
        (DEFAULT, 'non-observable');

/*
All item_... tables
*/
CREATE TABLE metadata_item (
    item_id SERIAL PRIMARY KEY,

    /*
    Actual table name
    */
    item_table_name TEXT NOT NULL,

    /*
    Item type: observable (feature item), potential observable, non-observable
    */
    item_type INTEGER NOT NULL, --fk

    /*
    Self referencing the item that is required to identify this item
    */
    required_item_id INTEGER, --fk

    /*
    Privilege level needed to add a new item
    */
    creation_privilege TEXT NOT NULL
);

/*
All data_... columns. These are either in 
item_..., location_..., feature_..., subfeature_..., list_..., or tdg_... tables
*/
CREATE TABLE metadata_column (
    column_id SERIAL PRIMARY KEY,
    
    /*
    Actual column and table name
    */
    column_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    
    /*
    Item that is related to this column. Note this isn't strictly the item that the data column is in,
    lists and local columns are still related to their feature's observable item. This is only NULL
    when the reference type is 'tdg'
    */
    metadata_item_id INTEGER, --fk 

    /*
    For frontend
    */
    is_nullable BOOLEAN NOT NULL,
    frontend_name TEXT NOT NULL,
    filter_selector INTEGER, --fk
    input_selector INTEGER, --fk
    frontend_type INTEGER NOT NULL, --fk
    information TEXT,

    /*
    For backend
    */
    sql_type INTEGER NOT NULL, --fk
    reference_type INTEGER NOT NULL --fk
);

/*
All returnable columns. This is different than data_... columns because they are specific to a certain
feature. For example there is one row in metadata_column for the data_room_number column of the item_room
table, but there are five rows in metadata_returnable for the data_room_number column of the item_room
table because it is a data column for each of the five features.
*/
CREATE TABLE metadata_returnable (
    returnable_id SERIAL PRIMARY KEY, -- used as the returnableID

    /*
    The associated data column in metadata_column. This is required because it contains all of the actual
    metadata for the column.
    */
    data_column_id INTEGER NOT NULL, --fk

    /*
    NULL if the reference_type of the associated metadata_column is 'submission'
    */
    feature_id INTEGER, --fk 

    /*
    The root feature for this subfeature, NULL if not subfeature
    */
    rootfeature_id INTEGER, --fk

    /*
    if F then feature_id must be NOT NULL
    if T then feature_id must be NULL
    */
    is_submission BOOLEAN NOT NULL,
    
    /*
    Arrays of table and columns needed to make the join to the column. These are different 
    for different returnables that reference the same metadata_column! This is the whole point, 
    The same data_... column is joined and treated differently in backend depending on the
    feature that references it
    */
    reference_column_list JSON,
    reference_table_list JSON,

    /*
    Specifies if this returnable is the standard geographic location for the feature.
    NULL if reference_type is not 'location'
    */
    is_real_geo BOOLEAN NOT NULL
);

/*
Contains the information on the various features and subfeatures. This includes the heirarchy
information as well as the other frontend metadata requirements.
*/
CREATE TABLE metadata_feature (
    feature_id SERIAL PRIMARY KEY,

    /*
    Actual table name (feature_... or subfeature_...)
    */
    table_name TEXT NOT NULL,

    /*
    Self referencing foreign key that specifies the parent feature. Note that this is only
    NOT NULL for subfeatures.
    */
    parent_id INTEGER, --fk

    /*
    direct to REST API numFeatureRange
    numFeatureRange is the allowable number of instantiations of a subfeature for its parent (is only non-NULL for subfeatures)
    */
    num_feature_range INTEGER,

    /*
    Frontend metadata
    */
    information TEXT,
    frontend_name TEXT NOT NULL,
);


-- FOREIGN KEYS --

-- Metadata

ALTER TABLE metadata_column ADD FOREIGN KEY (filter_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (sql_type) REFERENCES metadata_sql_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (reference_type) REFERENCES metadata_reference_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (frontend_type) REFERENCES metadata_frontend_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (input_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (rootfeature_id) REFERENCES metadata_feature;
ALTER TABLE metadata_column ADD FOREIGN KEY (feature_id) REFERENCES metadata_feature;

ALTER TABLE metadata_feature ADD FOREIGN KEY (parent_id) REFERENCES metadata_feature (feature_id);

-- Room, Building, Community, geom_region
ALTER TABLE item_room ADD FOREIGN KEY (item_building_id) REFERENCES item_building;
ALTER TABLE item_building ADD FOREIGN KEY (location_geom_region_id) REFERENCES location_geom_region;
ALTER TABLE item_building ADD FOREIGN KEY (item_entity_id) REFERENCES item_entity;
ALTER TABLE item_organization ADD FOREIGN KEY (item_entity_id) REFERENCES item_entity;

-- Uni, City, State, County, Country
ALTER TABLE item_entity ADD FOREIGN KEY (item_city_id) REFERENCES item_city;

ALTER TABLE item_city ADD FOREIGN KEY (item_county_id) REFERENCES item_county;
ALTER TABLE item_city ADD FOREIGN KEY (location_geom_region_id) REFERENCES location_geom_region;

ALTER TABLE item_county ADD FOREIGN KEY (item_state_id) REFERENCES item_state;
ALTER TABLE item_county ADD FOREIGN KEY (location_geom_region_id) REFERENCES location_geom_region;

ALTER TABLE item_state ADD FOREIGN KEY (item_country_id) REFERENCES item_country;
ALTER TABLE item_state ADD FOREIGN KEY (location_geom_region_id) REFERENCES location_geom_region;

ALTER TABLE item_country ADD FOREIGN KEY (location_geom_region_id) REFERENCES location_geom_region;

-- Submission
ALTER TABLE tdg_submission ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE tdg_submission ADD FOREIGN KEY (item_template_id) REFERENCES item_template;
ALTER TABLE tdg_submission ADD FOREIGN KEY (user_id) REFERENCES tdg_users;
ALTER TABLE tdg_submission ADD FOREIGN KEY (audit_id) REFERENCES tdg_audit;

-- SOP
ALTER TABLE tdg_sop_m2m ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count;
ALTER TABLE tdg_sop_m2m ADD FOREIGN KEY (sop_id) REFERENCES tdg_sop;
ALTER TABLE tdg_sop ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;

-- Template
ALTER TABLE item_template ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE item_template ADD FOREIGN KEY (tdg_user_id) REFERENCES tdg_users;

-- Auditor
ALTER TABLE tdg_auditor_m2m ADD FOREIGN KEY (user_id) REFERENCES tdg_users;
ALTER TABLE tdg_auditor_m2m ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count;

-- Users, Privilege
ALTER TABLE tdg_users ADD FOREIGN KEY (tdg_privilege_id) REFERENCES tdg_privilege;
ALTER TABLE tdg_users ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;

-- Audit
ALTER TABLE tdg_assigned_auditor_m2m ADD FOREIGN KEY (user_id) REFERENCES tdg_users;
ALTER TABLE tdg_assigned_auditor_m2m ADD FOREIGN KEY (audit_id) REFERENCES tdg_audit;

ALTER TABLE tdg_audit ADD FOREIGN KEY (catalog_id) REFERENCES tdg_catalog;
ALTER TABLE tdg_audit ADD FOREIGN KEY (user_id) REFERENCES tdg_users;

-- FUNCTIONS --

-- Auditor Name trigger function
--     Note that this is the function that the trigger calls, the trigger 
--     itself is dynamically generated in construct.js
CREATE FUNCTION check_auditor_name() RETURNS TRIGGER AS $check_auditor_name$
    BEGIN
        -- Both can't be NULL \
        IF (NEW.data_auditor IS NULL AND (SELECT (SELECT COUNT(*) FROM tdg_auditor_m2m WHERE observation_count_id = NEW.observation_count_id) = 0) ) THEN
            RAISE EXCEPTION '%.data_auditor and tdg_auditor_m2m.user_id cannot both be NULL', TG_TABLE_NAME;
            END IF;
        -- One must be NULL \
        IF (NEW.data_auditor IS NOT NULL AND (SELECT (SELECT COUNT(*) FROM tdg_auditor_m2m WHERE observation_count_id = NEW.observation_count_id) != 0) ) THEN
            RAISE EXCEPTION 'Either %.data_auditor or tdg_auditor_m2m.user_id must be NULL', TG_TABLE_NAME;
            END IF;
        -- Since no exceptions return the row \
        RETURN NEW;
    END;
    $check_auditor_name$ LANGUAGE plpgsql;


-- SET DEFAULTS --

-- Setting server timezone to LA time
SET timezone = 'America/Los_Angeles';