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
    data_room_number INT NOT NULL,
    item_building_id INT NOT NULL --fk
);

CREATE TABLE item_building (
    item_id SERIAL PRIMARY KEY, 
    item_community_id INT, --fk
    data_building_name TEXT NOT NULL,
    location_id INT NOT NULL --fk 
);

-- 

-- Community, Organization,
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

CREATE TABLE item_univeristy (
    item_id SERIAL PRIMARY KEY,
    university_name TEXT NOT NULL,
    university_address TEXT NOT NULL,
    item_city_id INTEGER NOT NULL, --
);

CREATE TABLE item_city (
    item_id SERIAL PRIMARY KEY,
    item_county_id INTEGER NOT NULL,
    data_city_name TEXT NOT NULL,
    data_population NUMERIC,
    location_point_id INTEGER NOT NULL
);

CREATE TABLE item_county (
    item_id SERIAL NOT NULL,
    data_fips_code NUMERIC NOT NULL UNIQUE,
    item_state_id INTEGER NOT NULL,
    data_county_name TEXT NOT NULL,
    location_geom_region_id INTEGER NOT NULL
);

CREATE TABLE item_state (
    item_id SERIAL NOT NULL,
    data_state_name TEXT NOT NULL,
    location_geom_region_id INTEGER NOT NULL,
    item_country_id INTEGER NOT NULL
);

CREATE TABLE item_country (
    item_id SERIAL NOT NULL,
    data_country_name TEXT NOT NULL,
    location_geom_region_id INTEGER NOT NULL
);

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  
    data_organization_name TEXT NOT NULL,
    item_univeristy_id INTEGER --fk
);

-- SOP, SOP Many to Many, Template
CREATE TABLE list_sop (
    item_id SERIAL PRIMARY KEY, 
    tdg_sop_filepath TEXT NOT NULL,
    data_sop_date_uploaded DATE NOT NULL,
    item_organization_id INT NOT NULL, --fk **I think this isn't a returnable row rn because list refs item**
    data_sop_name TEXT NOT NULL
);

CREATE TABLE list_sop_m2m (
    observation_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL
);

CREATE TABLE item_template (
    item_id SERIAL PRIMARY KEY,
    item_organization_id INT, --fk
    tdg_user_id INT, --fk
    data_template_name TEXT NOT NULL,
    data_template_json JSONB NOT NULL
);

-- Users, Privilege
CREATE TABLE tdg_users (
  tdg_id SERIAL PRIMARY KEY,
  tdg_privilege_id INT, --fk
  item_organization_id INT, --fk
  data_first_name TEXT NOT NULL,
  data_last_name TEXT NOT NULL,
  data_email TEXT NOT NULL,
  data_p_hash TEXT NOT NULL,
  data_p_salt TEXT NOT NULL
);

CREATE TABLE tdg_privilege (
  tdg_id INT PRIMARY KEY, 
  data_privilege_name TEXT NOT NULL
);

-- Submission
CREATE TABLE submission (
    submission_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER NOT NULL, --fk
    item_template_id INTEGER NOT NULL, --fk
    date_submitted DATE NOT NULL,
    data_submission_name TEXT
);

-- Auditor

CREATE TABLE item_auditor (
    item_id SERIAL PRIMARY KEY,
    auditor_name TEXT NOT NULL,
    user_id INTEGER --fk
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
        (DEFAULT, 'location'),
        (DEFAULT, 'item'),
        (DEFAULT, 'list');

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
        (DEFAULT, 'DATE'),
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
        (DEFAULT, 'boolean', 'Display “True” for 1 and “False” for 0');


CREATE TABLE metadata_column ( -- Add featureitem_location??
    column_id SERIAL PRIMARY KEY, -- used as the columnBackendID
    feature_id INTEGER NOT NULL, --fk
    rootfeature_id INTEGER NOT NULL, --fk
    frontend_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    reference_column_name JSON NOT NULL,
    reference_table_name JSON NOT NULL,
    information TEXT,

    filter_selector INTEGER NOT NULL, --fk
    input_selector INTEGER NOT NULL, --fk
    sql_type INTEGER NOT NULL, --fk
    reference_type INTEGER NOT NULL, --fk
    frontend_type INTEGER NOT NULL, --fk

    is_nullable BOOLEAN NOT NULL,
    is_default BOOLEAN NOT NULL,
    is_global BOOLEAN NOT NULL,  
    is_ground_truth BOOLEAN --NULL if reference_type is not 'location'
);

CREATE TABLE metadata_feature (
    feature_id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    parent_id INTEGER NOT NULL, --fk
    num_feature_range INTEGER NOT NULL,
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
ALTER TABLE item_building ADD FOREIGN KEY (location_id) REFERENCES location_geom_region;
ALTER TABLE item_community ADD FOREIGN KEY (location_id) REFERENCES location_geom_region;
ALTER TABLE item_building ADD FOREIGN KEY (item_community_id) REFERENCES item_community;
ALTER TABLE item_organization ADD FOREIGN KEY (item_community_id) REFERENCES item_community;

-- Submission
ALTER TABLE submission ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE submission ADD FOREIGN KEY (item_template_id) REFERENCES item_template;

-- SOP
ALTER TABLE item_sop_m2m ADD FOREIGN KEY (item_id) REFERENCES item_sop;
ALTER TABLE item_sop ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;

-- Template
ALTER TABLE item_template ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE item_template ADD FOREIGN KEY (tdg_user_id) REFERENCES tdg_users;

-- Auditor
ALTER TABLE item_auditor ADD FOREIGN KEY (user_id) REFERENCES tdg_users;

-- Users, Privilege
ALTER TABLE tdg_users ADD FOREIGN KEY (tdg_privilege_id) REFERENCES tdg_privilege;
ALTER TABLE tdg_users ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;

