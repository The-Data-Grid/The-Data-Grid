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

-- Community, Organization,
CREATE TABLE item_community (
    item_id SERIAL PRIMARY KEY, 
    data_community_name TEXT UNIQUE NOT NULL,
    data_city TEXT NOT NULL,
    data_state TEXT NOT NULL,
    data_country TEXT NOT NULL,
    location_id INT NOT NULL --fk
);

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  
    data_organization_name TEXT NOT NULL,
    item_community_id INT NOT NULL --fk
);

-- SOP, SOP Many to Many, Template
CREATE TABLE item_sop (
    item_id SERIAL PRIMARY KEY, 
    data_sop_filepath TEXT NOT NULL,
    data_sop_date_uploaded DATE NOT NULL,
    item_organization_id INT NOT NULL, --fk
    data_sop_name TEXT
);

CREATE TABLE item_sop_m2m (
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
    date_submitted DATE NOT NULL
);

-- Auditor

CREATE TABLE item_auditor (
    item_id SERIAL PRIMARY KEY,
    auditor_name TEXT NOT NULL,
    user_id INTEGER --fk
);

-- Metadata
CREATE TABLE metadata_selector (
    selector_id SERIAL PRIMARY KEY,
    selector_name TEXT
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
        (DEFAULT, 'searchableChecklistDropdown');

CREATE TABLE metadata_datatype (
    datatype_id SERIAL PRIMARY KEY,
    datatype_name TEXT NOT NULL,
    frontend_name TEXT NOT NULL,
    datatype_description TEXT NOT NULL
);

CREATE TABLE metadata_column ( -- Add featureitem_location??
    column_id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL, --fk
    display_name TEXT NOT NULL,
    backend_name TEXT NOT NULL,
    list_name TEXT, --null if not list data
    filter_selector INTEGER, --fk
    input_selector INTEGER, --fk
    nullable BOOLEAN NOT NULL,
    information TEXT,
    accuracy NUMERIC, 
    datatype_id INTEGER NOT NULL --fk
);

CREATE TABLE metadata_table (
    table_id SERIAL PRIMARY KEY,
    frontend_name TEXT NOT NULL,
    backend_name TEXT NOT NULL,
    parent_id INTEGER --fk references itself
);


-- FOREIGN KEYS --

-- Metadata
ALTER TABLE metadata_column ADD FOREIGN KEY (table_id) REFERENCES metadata_table;
ALTER TABLE metadata_column ADD FOREIGN KEY (filter_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (input_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (datatype_id) REFERENCES metadata_datatype;
ALTER TABLE metadata_table ADD FOREIGN KEY (parent_id) REFERENCES metadata_table (table_id);

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

