
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
    item_id SERIAL PRIMARY KEY, --uuid
    item_community_id INT, --fk, uuid
    data_building_name TEXT NOT NULL,
    location_id INT NOT NULL --fk 
);

-- Community, Organization,
CREATE TABLE item_community (
    item_id SERIAL PRIMARY KEY, --uuid
    data_community_name TEXT UNIQUE NOT NULL,
    data_city TEXT NOT NULL,
    data_state TEXT NOT NULL,
    data_country TEXT NOT NULL,
    location_id INT NOT NULL --fk
);

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  --uuid
    data_organization_name TEXT NOT NULL,
    item_community_id INT NOT NULL --fk
);

-- SOP, SOP Many to Many, Template
CREATE TABLE item_sop (
    item_id SERIAL PRIMARY KEY, --uuid
    data_sop_filepath TEXT NOT NULL,
    data_sop_date_uploaded DATE NOT NULL,
    item_organization_id INT NOT NULL, --fk, uuid
    data_sop_name TEXT
);

CREATE TABLE item_sop_m2m (
    observation_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL
);

CREATE TABLE item_template (
    item_id SERIAL PRIMARY KEY, --uuid
    item_organization_id INT, --fk, uuid
    tdg_user_id INT, --fk, uuid
    data_template_name TEXT NOT NULL,
    data_template_json JSONB NOT NULL
);

-- Users, Privilege
CREATE TABLE tdg_users (
  tdg_id SERIAL PRIMARY KEY, --uuid
  tdg_privilege_id INT, --fk, uuid
  item_organization_id INT, --fk, uuid
  data_first_name TEXT NOT NULL,
  data_last_name TEXT NOT NULL,
  data_email TEXT NOT NULL,
  data_p_hash TEXT NOT NULL,
  data_p_salt TEXT NOT NULL
);

CREATE TABLE tdg_privilege (
  tdg_id INT PRIMARY KEY, --uuid
  data_privilege_name TEXT NOT NULL
);

-- Submission
CREATE TABLE submission (
    submission_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER NOT NULL, --FK
    item_template_id INTEGER NOT NULL, --FK
    date_submitted DATE NOT NULL
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


-- Foreign Keys

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

-- Users, Privilege
ALTER TABLE tdg_users ADD FOREIGN KEY (tdg_privilege_id) REFERENCES tdg_privilege;
ALTER TABLE tdg_users ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;

















-- Feature tables

/*
CREATE TABLE feature_toilet (
    observation_id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL, --FK
    featureitem_id INTEGER NOT NULL, --FK
    data_date_conducted DATE NOT NULL, 
    data_gpf NUMERIC,
    data_commentary NUMERIC
);

CREATE TABLE subfeature_toilet_flushometer (
    observation_id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL, --FK
    featureitem_id INTEGER NOT NULL, --FK
    data_date_conducted DATE NOT NULL, 
)

CREATE TABLE list_m2m_toilet_flushometer_condition (
    observation_id INTEGER NOT NULL, --FK
    list_id INTEGER NOT NULL, --FK
    PRIMARY KEY(observation_id, list_id)
);

CREATE TABLE list_m2m_toilet_flushometer_brand (
    observation_id INTEGER NOT NULL, --FK
    list_id INTEGER NOT NULL, --FK
    PRIMARY KEY(observation_id, list_id)
);

CREATE TABLE feature_urinal (

);


*/










