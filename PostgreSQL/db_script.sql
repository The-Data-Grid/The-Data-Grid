--Create Tables
CREATE TABLE item_template ( --strings of column names that represent user's template
  template_id SERIAL PRIMARY KEY, --uuid
  organization_id INT NOT NULL, --fk, uuid
  user_id INT NOT NULL, --fk, uuid
  template_name TEXT NOT NULL,
  room_string jsonb NOT NULL,  --a string of column names that references water_general
  urinal_string jsonb NOT NULL,  --a string of column names that references water_urinal
  sink_string jsonb NOT NULL,  --a string of column names that references water_sink
  toilet_string jsonb NOT NULL,  --a string of column names that references water_toilet
  mirror_string jsonb NOT NULL --a string of column names that references water_mirror
);

CREATE TABLE audit_submission (
  audit_id SERIAL PRIMARY KEY, --uuid, fk
  organization_id INT NOT NULL, --uuid, fk
  sop_id INT NOT NULL, --fk
  template_id INT, --fk
  date_submitted DATE NOT NULL
);

CREATE TABLE audit_sink (
  observation_id SERIAL PRIMARY KEY, --uuid
  audit_id INT NOT NULL, --uuid, fk
  gpm NUMERIC,
  location_id INT,
  date_conducted DATE NOT NULL,
  commentary TEXT
);

CREATE TABLE sink_faucet_brand (
  faucet_brand_id SERIAL PRIMARY KEY,
  faucet_brand_name TEXT
);

CREATE TABLE sink_faucet_brand_m2m (
  observation_id INT,
  faucet_brand_id INT
);

CREATE TABLE sink_faucet_condition (
  faucet_condition_id SERIAL PRIMARY KEY,
  faucet_condition_name TEXT
);

CREATE TABLE sink_faucet_condition_m2m (
  observation_id INT,
  faucet_condition_id INT
);

CREATE TABLE sink_basin_brand (
  basin_brand_id SERIAL PRIMARY KEY,
  basin_brand_name TEXT
);

CREATE TABLE sink_basin_brand_m2m (
  observation_id INT,
  basin_brand_id INT
);

CREATE TABLE sink_basin_condition (
  basin_condition_id SERIAL PRIMARY KEY,
  basin_condition_name TEXT
);

CREATE TABLE sink_basin_condition_m2m (
  observation_id INT,
  basin_condition_id INT
);

CREATE TABLE sink_sensor_condition (
  sensor_condition_id SERIAL PRIMARY KEY,
  sensor_condition_name TEXT
);

CREATE TABLE sink_sensor_condition_m2m (
  observation_id INT,
  sensor_condition_id INT
);

CREATE TABLE audit_urinal (
  observation_id SERIAL PRIMARY KEY, --uuid
  audit_id INT NOT NULL, --uuid, fk
  gpf NUMERIC,
  location_id INT,
  date_conducted DATE NOT NULL,
  commentary TEXT
);

CREATE TABLE urinal_flushometer_brand (
  flushometer_brand_id SERIAL PRIMARY KEY,
  flushometer_brand_name TEXT
);

CREATE TABLE urinal_flushometer_brand_m2m (
  observation_id INT,
  flushometer_brand_id INT
);

CREATE TABLE urinal_flushometer_condition (
  flushometer_condition_id SERIAL PRIMARY KEY,
  flushometer_condition_name TEXT
);

CREATE TABLE urinal_flushometer_condition_m2m (
  observation_id INT,
  flushometer_condition_id INT
);

CREATE TABLE urinal_basin_brand (
  basin_brand_id SERIAL PRIMARY KEY,
  basin_brand_name TEXT
);

CREATE TABLE urinal_basin_brand_m2m (
  observation_id INT,
  basin_brand_id INT
);

CREATE TABLE urinal_basin_condition (
  basin_condition_id SERIAL PRIMARY KEY,
  basin_condition_name TEXT
);

CREATE TABLE urinal_basin_condition_m2m (
  observation_id INT,
  basin_condition_id INT
);

CREATE TABLE urinal_sensor_condition (
  sensor_condition_id SERIAL PRIMARY KEY,
  sensor_condition_name TEXT
);

CREATE TABLE urinal_sensor_condition_m2m (
  observation_id INT,
  sensor_condition_id INT
);

CREATE TABLE urinal_divider_condition (
  divider_condition_id SERIAL PRIMARY KEY,
  divider_condition_name TEXT
);

CREATE TABLE urinal_divider_condition_m2m (
  observation_id INT,
  divider_condition_id INT
);

CREATE TABLE audit_mirror (
  observation_id SERIAL PRIMARY KEY, --uuid
  audit_id INT NOT NULL, --uuid, fk
  location_id INT NOT NULL, --fk
  date_conducted DATE NOT NULL,
  commentary TEXT
);

CREATE TABLE mirror_condition (
  condition_id SERIAL PRIMARY KEY,
  condition_name TEXT
);

CREATE TABLE mirror_condition_m2m (
  observation_id INT,
  condition_id INT
);

CREATE TABLE audit_toilet (
  observation_id SERIAL PRIMARY KEY, --uuid
  audit_id INT NOT NULL, --uuid, fk
  gpf NUMERIC,
  date_conducted DATE NOT NULL,
  location_id INT,
  commentary TEXT
);

CREATE TABLE toilet_flushometer_brand (
  flushometer_brand_id SERIAL PRIMARY KEY,
  flushometer_brand_name TEXT
);

CREATE TABLE toilet_flushometer_brand_m2m (
  observation_id INT,
  flushometer_brand_id INT
);

CREATE TABLE toilet_flushometer_condition (
  flushometer_condition_id SERIAL PRIMARY KEY,
  flushometer_condition_name TEXT
);

CREATE TABLE toilet_flushometer_condition_m2m (
  observation_id INT,
  flushometer_condition_id INT
);

CREATE TABLE toilet_basin_brand (
  basin_brand_id SERIAL PRIMARY KEY,
  basin_brand_name TEXT
);

CREATE TABLE toilet_basin_brand_m2m (
  observation_id INT,
  basin_brand_id INT
);

CREATE TABLE toilet_basin_condition (
  basin_condition_id SERIAL PRIMARY KEY,
  basin_condition_name TEXT
);

CREATE TABLE toilet_basin_condition_m2m (
  observation_id INT,
  basin_condition_id INT
);

CREATE TABLE toilet_sensor_condition (
  sensor_condition_id SERIAL PRIMARY KEY,
  sensor_condition_name TEXT
);

CREATE TABLE toilet_sensor_condition_m2m (
  observation_id INT,
  sensor_condition_id INT
);

CREATE TABLE toilet_stall_condition (
  stall_condition_id SERIAL PRIMARY KEY,
  stall_condition_name TEXT
);

CREATE TABLE toilet_stall_condition_m2m (
  observation_id INT,
  stall_condition_id INT
);

CREATE TABLE audit_room (
  observation_id SERIAL PRIMARY KEY, --uuid
  audit_id INT NOT NULL, --uuid, fk
  location_id INT, -- fk
  exhaust_exit BOOLEAN,
  date_conducted DATE NOT NULL,
  access_panel BOOLEAN,
  commentary TEXT
);


-- CREATE TABLE perspective_picture_id (
--   perspective_picture_id VARCHAR(40) PRIMARY KEY, --uuid
--   picture_file VARCHAR(40), --file location on server of picture
-- );
--
-- CREATE TABLE number_picture (
--   number_picture_id VARCHAR(40) PRIMARY KEY, --uuid
--   picture_file VARCHAR(40), --file location on server of picture
-- );

CREATE TABLE item_room (
  room_id SERIAL PRIMARY KEY,
  room_number INT NOT NULL,
  building_id INT NOT NULL --fk
);

CREATE TABLE item_building (
  building_id SERIAL PRIMARY KEY, --uuid
  community_id INT, --fk, uuid
  building_name TEXT NOT NULL,
  location_id INT NOT NULL --fk 
);

CREATE TABLE item_community (
  community_id SERIAL PRIMARY KEY, --uuid
  community_name TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  location_id INT NOT NULL --fk
);

CREATE TABLE item_organization (
  organization_id SERIAL PRIMARY KEY,  --uuid
  organization_name TEXT NOT NULL,
  community_id INT NOT NULL --fk
);

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY, --uuid
  privilege_id INT, --fk, uuid
  organization_id INT, --fk, uuid
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  p_hash TEXT NOT NULL,
  p_salt TEXT NOT NULL
);

CREATE TABLE privilege (
  privilege_id INT PRIMARY KEY, --uuid
  privilege_name TEXT
);

CREATE TABLE sop (
  sop_id SERIAL PRIMARY KEY, --uuid
  sop_filepath TEXT NOT NULL,
  sop_date_uploaded DATE NOT NULL,
  organization_id INT NOT NULL, --fk, uuid
  sop_name TEXT
);

CREATE TABLE loc (
  location_id SERIAL PRIMARY KEY,
  room_id INT, --fk
  point_id INT, --fk
  geom_region_id INT, --fk
  CHECK ((room_id IS NULL AND point_id IS NULL AND geom_region_id IS NOT NULL ) OR
  (geom_region_id IS NULL AND point_id IS NULL AND room_id IS NOT NULL) OR 
  (geom_region_id IS NULL AND room_id IS NULL AND point_id IS NOT NULL))
);

CREATE TABLE item_point (
  point_id SERIAL PRIMARY KEY,
  longitude NUMERIC NOT NULL,
  latitude NUMERIC NOT NULL
);

CREATE TABLE item_geom_region (
  geom_region_id SERIAL PRIMARY KEY,
  region JSONB NOT NULL
);

CREATE TABLE feature_type (
  feature_type_id SERIAL PRIMARY KEY,
  feature_name TEXT
);

CREATE TABLE item_type (
  item_type_id SERIAL PRIMARY KEY,
  item_name TEXT
);

--Functions
CREATE FUNCTION community_location(INT) returns BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM loc 
    WHERE location_id = $1
    AND room_id IS NULL
  );
  $$ language sql;

CREATE FUNCTION building_location(INT) returns BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM loc 
    WHERE location_id = $1
    AND room_id IS NULL
  );
  $$ language sql;

CREATE FUNCTION room_location(INT) returns BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM loc 
    WHERE location_id = $1
    AND room_id IS NOT NULL
  );
  $$ language sql;


-- Foreign Key References

ALTER TABLE item_template ADD FOREIGN KEY (organization_id) REFERENCES item_organization;
ALTER TABLE item_template ADD FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE audit_submission ADD FOREIGN KEY (organization_id) REFERENCES item_organization;
ALTER TABLE audit_submission ADD FOREIGN KEY (sop_id) REFERENCES sop;
ALTER TABLE audit_submission ADD FOREIGN KEY (template_id) REFERENCES item_template;

ALTER TABLE audit_sink ADD FOREIGN KEY (audit_id) REFERENCES audit_submission;
ALTER TABLE audit_sink ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE audit_urinal ADD FOREIGN KEY (audit_id) REFERENCES audit_submission;
ALTER TABLE audit_urinal ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE audit_mirror ADD FOREIGN KEY (audit_id) REFERENCES audit_submission;
ALTER TABLE audit_mirror ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE audit_toilet ADD FOREIGN KEY (audit_id) REFERENCES audit_submission;
ALTER TABLE audit_toilet ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE audit_room ADD FOREIGN KEY (audit_id) REFERENCES audit_submission;
ALTER TABLE audit_room ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE item_room ADD FOREIGN KEY (building_id) REFERENCES item_building;

ALTER TABLE item_building ADD FOREIGN KEY (community_id) REFERENCES item_community;
ALTER TABLE item_building ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE item_community ADD FOREIGN KEY (location_id) REFERENCES loc;

ALTER TABLE item_organization ADD FOREIGN KEY (community_id) REFERENCES item_community;

ALTER TABLE users ADD FOREIGN KEY (privilege_id) REFERENCES privilege;
ALTER TABLE users ADD FOREIGN KEY (organization_id) REFERENCES item_organization;

ALTER TABLE sop ADD FOREIGN KEY (organization_id) REFERENCES item_organization;

ALTER TABLE loc ADD FOREIGN KEY (room_id) REFERENCES item_room;
ALTER TABLE loc ADD FOREIGN KEY (point_id) REFERENCES item_point;
ALTER TABLE loc ADD FOREIGN KEY (geom_region_id) REFERENCES item_geom_region;


-- Many to Many keys

ALTER TABLE sink_faucet_brand_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_sink;
ALTER TABLE sink_faucet_brand_m2m ADD FOREIGN KEY (faucet_brand_id) REFERENCES sink_faucet_brand;

ALTER TABLE sink_faucet_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_sink;
ALTER TABLE sink_faucet_condition_m2m ADD FOREIGN KEY (faucet_condition_id) REFERENCES sink_faucet_condition;

ALTER TABLE sink_basin_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_sink;
ALTER TABLE sink_basin_condition_m2m ADD FOREIGN KEY (basin_condition_id) REFERENCES sink_basin_condition;

ALTER TABLE sink_basin_brand_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_sink;
ALTER TABLE sink_basin_brand_m2m ADD FOREIGN KEY (basin_brand_id) REFERENCES sink_basin_condition;

ALTER TABLE sink_sensor_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_sink;
ALTER TABLE sink_sensor_condition_m2m ADD FOREIGN KEY (sensor_condition_id) REFERENCES sink_sensor_condition;

ALTER TABLE urinal_flushometer_brand_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_urinal;
ALTER TABLE urinal_flushometer_brand_m2m ADD FOREIGN KEY (flushometer_brand_id) REFERENCES urinal_flushometer_brand;

ALTER TABLE urinal_flushometer_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_urinal;
ALTER TABLE urinal_flushometer_condition_m2m ADD FOREIGN KEY (flushometer_condition_id) REFERENCES urinal_flushometer_condition;

ALTER TABLE urinal_basin_brand_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_urinal;
ALTER TABLE urinal_basin_brand_m2m ADD FOREIGN KEY (basin_brand_id) REFERENCES urinal_basin_brand;

ALTER TABLE urinal_basin_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_urinal;
ALTER TABLE urinal_basin_condition_m2m ADD FOREIGN KEY (basin_condition_id) REFERENCES urinal_basin_condition;

ALTER TABLE urinal_sensor_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_urinal;
ALTER TABLE urinal_sensor_condition_m2m ADD FOREIGN KEY (sensor_condition_id) REFERENCES urinal_sensor_condition;

ALTER TABLE urinal_divider_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_urinal;
ALTER TABLE urinal_divider_condition_m2m ADD FOREIGN KEY (divider_condition_id) REFERENCES urinal_divider_condition;

ALTER TABLE mirror_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_mirror;
ALTER TABLE mirror_condition_m2m ADD FOREIGN KEY (condition_id) REFERENCES mirror_condition;

ALTER TABLE toilet_flushometer_brand_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_toilet;
ALTER TABLE toilet_flushometer_brand_m2m ADD FOREIGN KEY (flushometer_brand_id) REFERENCES toilet_flushometer_brand;

ALTER TABLE toilet_flushometer_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_toilet;
ALTER TABLE toilet_flushometer_condition_m2m ADD FOREIGN KEY (flushometer_condition_id) REFERENCES toilet_flushometer_condition;

ALTER TABLE toilet_basin_brand_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_toilet;
ALTER TABLE toilet_basin_brand_m2m ADD FOREIGN KEY (basin_brand_id) REFERENCES toilet_basin_brand;

ALTER TABLE toilet_basin_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_toilet;
ALTER TABLE toilet_basin_condition_m2m ADD FOREIGN KEY (basin_condition_id) REFERENCES toilet_basin_condition;

ALTER TABLE toilet_sensor_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_toilet;
ALTER TABLE toilet_sensor_condition_m2m ADD FOREIGN KEY (sensor_condition_id) REFERENCES toilet_sensor_condition;

ALTER TABLE toilet_stall_condition_m2m ADD FOREIGN KEY (observation_id) REFERENCES audit_toilet;
ALTER TABLE toilet_stall_condition_m2m ADD FOREIGN KEY (stall_condition_id) REFERENCES toilet_stall_condition;

-- Location Check Constraints

ALTER TABLE item_community ADD CONSTRAINT community_cant_ref_room CHECK (community_location(location_id));
ALTER TABLE item_building ADD CONSTRAINT building_cant_ref_room CHECK (building_location(location_id));
ALTER TABLE audit_room ADD CONSTRAINT room_must_ref_room CHECK (building_location(location_id));

