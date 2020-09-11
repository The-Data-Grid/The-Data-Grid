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
    item_university_id INTEGER, --fk **    
    location_geom_region_id INTEGER NOT NULL --fk **
);

-- 

-- Community (deprecated)
/*
CREATE TABLE item_community (
    item_id SERIAL PRIMARY KEY, 
    data_community_name TEXT UNIQUE NOT NULL,
    data_city TEXT NOT NULL,
    data_state TEXT NOT NULL,
    data_country TEXT NOT NULL,
    location_id INT NOT NULL --fk
);
*/

-- Organization, University, City, County, State, Country

CREATE TABLE item_university (
    item_id SERIAL PRIMARY KEY,
    data_university_name TEXT NOT NULL,
    data_university_address TEXT NOT NULL,
    item_city_id INTEGER NOT NULL --fk **
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
    data_organization_name TEXT NOT NULL,
    item_university_id INTEGER --fk **
);

-- Observation supertable, SOP and User which reference it

CREATE TABLE tdg_observation_count (
    observation_count_id SERIAL PRIMARY KEY
);

CREATE TABLE tdg_sop (
    sop_id SERIAL PRIMARY KEY, 
    tdg_filepath TEXT NOT NULL,
    data_name TEXT NOT NULL,
    data_time_uploaded TIMESTAMPTZ NOT NULL,
    item_organization_id INT NOT NULL --fk **
);

CREATE TABLE tdg_sop_m2m (
    observation_count_id INTEGER NOT NULL, --fk **
    sop_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_template (
    item_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER, --fk **
    tdg_user_id INTEGER, --fk **
    data_template_name TEXT NOT NULL,
    data_template_json JSONB NOT NULL
);

CREATE TABLE tdg_auditor_m2m (
    observation_count_id INTEGER NOT NULL, --fk **
    user_id INTEGER NOT NULL --fk **
);

CREATE TABLE tdg_users (
    user_id SERIAL PRIMARY KEY,
    tdg_privilege_id INT NOT NULL, --fk **
    item_organization_id INT NOT NULL, --fk **
    data_first_name TEXT NOT NULL,
    data_last_name TEXT NOT NULL,
    tdg_email TEXT NOT NULL,
    tdg_p_hash TEXT NOT NULL,
    tdg_p_salt TEXT NOT NULL
);

CREATE TABLE tdg_privilege (
    privilege_id INT PRIMARY KEY, 
    data_privilege_name TEXT NOT NULL
);

-- Submission
CREATE TABLE tdg_submission (
    submission_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER NOT NULL, --fk **
    tdg_user_id INTEGER NOT NULL, --fk **
    item_template_id INTEGER, --fk **
    data_time_submitted TIMESTAMPTZ NOT NULL,
    data_submission_name TEXT NOT NULL
);

-- Metadata --

CREATE TABLE metadata_reference_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_reference_type
    (type_id, type_name)
    VALUES
        (DEFAULT, 'local'),
        (DEFAULT, 'local-global'),
        (DEFAULT, 'location'),
        (DEFAULT, 'item'),
        (DEFAULT, 'list'),
        (DEFAULT, 'special'),
        (DEFAULT, 'submission');

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


CREATE TABLE metadata_column ( -- Add featureitem_location??
    column_id SERIAL PRIMARY KEY, -- used as the columnBackendID
    feature_id INTEGER, --fk
    rootfeature_id INTEGER, --fk
    frontend_name TEXT NOT NULL,
    column_name TEXT,
    table_name TEXT,
    reference_column_name JSON,
    reference_table_name JSON,
    information TEXT,

    filter_selector INTEGER, --fk
    input_selector INTEGER, --fk
    sql_type INTEGER NOT NULL, --fk
    reference_type INTEGER NOT NULL, --fk
    frontend_type INTEGER NOT NULL, --fk

    is_nullable BOOLEAN NOT NULL,
    is_default BOOLEAN NOT NULL,
    is_global BOOLEAN NOT NULL,  
    is_ground_truth BOOLEAN, --NULL if reference_type is not 'location'

    unique_identifier JSON --NULL if reference_type is not 'item'
);

CREATE TABLE metadata_feature (
    feature_id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    parent_id INTEGER, --fk
    num_feature_range INTEGER,
    information TEXT,
    frontend_name TEXT NOT NULL
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
ALTER TABLE item_building ADD FOREIGN KEY (item_university_id) REFERENCES item_university;
ALTER TABLE item_organization ADD FOREIGN KEY (item_university_id) REFERENCES item_university;

-- Uni, City, State, County, Country
ALTER TABLE item_university ADD FOREIGN KEY (item_city_id) REFERENCES item_city;

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
ALTER TABLE tdg_submission ADD FOREIGN KEY (tdg_user_id) REFERENCES tdg_users;

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

-- FUNCTIONS --

-- Auditor Name trigger function
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