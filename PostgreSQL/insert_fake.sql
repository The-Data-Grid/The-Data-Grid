/* Add location and community for UCLA (generic)*/

INSERT INTO item_point
  (point_id, longitude, latitude)
  VALUES (DEFAULT, 34.068445, -118.442225);

INSERT INTO loc --1: UCLA
  (location_id, point_id)
  VALUES (DEFAULT, currval('item_point_point_id_seq'));

INSERT INTO item_community
  (community_id, community_name, city, state, country, location_id)
  VALUES (DEFAULT, 'UCLA', 'Los Angeles', 'California', 'United States of America', currval('loc_location_id_seq'));

/* Add additional location types */

INSERT INTO item_building --Boelter
  (building_id, community_id, building_name, location_id)
  VALUES (DEFAULT, currval('item_community_community_id_seq'), 'Boelter Hall', 1);

INSERT INTO item_room
  (room_id, room_number, building_id)
  VALUES (DEFAULT, 5420, currval('item_building_building_id_seq'));

INSERT INTO loc --2: Boelter 5420
  (location_id, room_id)
  VALUES (DEFAULT, currval('item_room_room_id_seq'));

INSERT INTO item_room
  (room_id, room_number, building_id)
  VALUES (DEFAULT, 2821, currval('item_building_building_id_seq'));

INSERT INTO loc --3: Boelter 2821
  (location_id, room_id)
  VALUES (DEFAULT, currval('item_room_room_id_seq'));

INSERT INTO item_building --Young
  (building_id, community_id, building_name, location_id)
  VALUES (DEFAULT, currval('item_community_community_id_seq'), 'Young Hall', 1);

INSERT INTO item_room
  (room_id, room_number, building_id)
  VALUES (DEFAULT, 2200, currval('item_building_building_id_seq'));

INSERT INTO loc --4: Young 2200
  (location_id, room_id)
  VALUES (DEFAULT, currval('item_room_room_id_seq'));

INSERT INTO item_geom_region
  (geom_region_id, region)
  VALUES (DEFAULT, '{
                      "type": "Feature",
                      "geometry": {
                        "type": "Point",
                        "coordinates": [125.6, 10.1]
                      },
                      "properties": {
                        "name": "Dinagat Islands"
                      }
                    }');

INSERT INTO loc --5: Dinagat Islands
  (location_id, geom_region_id)
  VALUES (DEFAULT, currval('item_geom_region_geom_region_id_seq'));

/* Add organizations */

INSERT INTO item_organization
  (organization_id, organization_name, community_id)
  VALUES (DEFAULT, 'Renewable Energy Association', currval('item_community_community_id_seq'));

INSERT INTO item_organization
  (organization_id, organization_name, community_id)
  VALUES (DEFAULT, 'Bruin Home Solutions', currval('item_community_community_id_seq'));

/* Add SOPs */

INSERT INTO sop
  (sop_id, sop_filepath, sop_date_uploaded, organization_id, sop_name)
  VALUES (DEFAULT, '/home/sops/toilet_audit_sop.pdf', '2015-06-07', currval('item_organization_organization_id_seq'), 'Toilet Audit SOP');

/* Add privileges */

INSERT INTO privilege
  (privilege_id, privilege_name)
  VALUES  (4, 'none'),
          (3, 'user'),
          (2, 'auditor'),
          (1, 'org_admin'),
          (0, 'global_admin');

/* Add users */

INSERT INTO users
  (user_id, privilege_id, organization_id, first_name, last_name, email, p_hash, p_salt)
  VALUES
    (DEFAULT, 0, currval('item_organization_organization_id_seq'), 'Olivian', 'Zhang', 'oz@ucla.edu', 'hash1', 'salt1'),
    (DEFAULT, 2, currval('item_organization_organization_id_seq'), 'Harold', 'Auditorsky', 'ht@ucla.edu', 'hash2', 'salt2');

/* Add templates */

INSERT INTO item_template
  (template_id, organization_id, user_id, template_name, room_string, urinal_string, sink_string, toilet_string, mirror_string)
  VALUES
    (DEFAULT,
    currval('item_organization_organization_id_seq'), 
    currval('users_user_id_seq'),
    '{"template_name": "Toilet Audit Template"}',
    '{"room_string": "test"}',
    '{"urinal_string": "test"}',
    '{"sink_string": "test"}',
    '{"toilet_string": "test"}',
    '{"mirror_string": "test"}'); 

/* Add audits */

INSERT INTO audit_submission
  (audit_id, organization_id, sop_id, template_id, date_submitted)
  VALUES (1,
    1,
    currval('sop_sop_id_seq'),
    currval('item_template_template_id_seq'),
    '03-14-2020');

INSERT INTO audit_submission
  (audit_id, organization_id, sop_id, template_id, date_submitted)
  VALUES (2,
    2,
    currval('sop_sop_id_seq'),
    currval('item_template_template_id_seq'),
    '04-15-2020');

INSERT INTO audit_submission
  (audit_id, organization_id, sop_id, template_id, date_submitted)
  VALUES (3,
    2,
    currval('sop_sop_id_seq'),
    currval('item_template_template_id_seq'),
    '04-16-2020');

INSERT INTO audit_submission
  (audit_id, organization_id, sop_id, template_id, date_submitted)
  VALUES (4,
    1,
    currval('sop_sop_id_seq'),
    currval('item_template_template_id_seq'),
    '05-20-2020');

INSERT INTO audit_submission
  (audit_id, organization_id, sop_id, template_id, date_submitted)
  VALUES (5,
    2,
    currval('sop_sop_id_seq'),
    currval('item_template_template_id_seq'),
    '05-26-2020');

/* Add toilet brand, condition information */

INSERT INTO toilet_flushometer_brand
  (flushometer_brand_id, flushometer_brand_name)
  VALUES
    (DEFAULT, 'Toilet Flushometer Brand 1'),
    (DEFAULT, 'Toilet Flushometer Brand 2');

INSERT INTO toilet_flushometer_condition
  (flushometer_condition_id, flushometer_condition_name)
  VALUES
    (1, 'Leaking'),
    (2, 'Push valve problem'),
    (3, 'Sensor broken');

INSERT INTO toilet_basin_brand
  (basin_brand_id, basin_brand_name)
  VALUES
    (DEFAULT, 'Toilet Basin Brand 1'),
    (DEFAULT, 'Toilet Basin Brand 2');

INSERT INTO toilet_basin_condition
  (basin_condition_id, basin_condition_name)
  VALUES
    (1, 'Leaking'),
    (2, 'Broken/Missing seat');

INSERT INTO toilet_stall_condition
  (stall_condition_id, stall_condition_name)
  VALUES
    (DEFAULT, 'Locking problem'),
    (DEFAULT, 'Door jam');

INSERT INTO toilet_sensor_condition
  (sensor_condition_id, sensor_condition_name)
  VALUES
    (DEFAULT, 'Good sensor'),
    (DEFAULT, 'Bad sensor');

/* Add toilet data for audit 1 */

INSERT INTO audit_toilet
  (observation_id, audit_id, gpf, date_conducted, location_id, commentary)
  VALUES
    (DEFAULT, 1, 1.5, '03-11-2020', 2,'Commentary on audited toilet 1'),
    (DEFAULT, 1, 2.5, '03-11-2020', 2,'Commentary on audited toilet 2'),
    (DEFAULT, 1, 1.4, '03-12-2020', 2,'Commentary on audited toilet 3'),
    (DEFAULT, 1, 1.3, '03-12-2020', 2,'Commentary on audited toilet 4');
  
INSERT INTO toilet_flushometer_brand_m2m
  (observation_id, flushometer_brand_id)
  VALUES
    (1, 1),
    (2, 2),
    (3, 1),
    (4, 1);

INSERT INTO toilet_flushometer_condition_m2m
  (observation_id, flushometer_condition_id)
  VALUES
    (1, 1),
    (2, 2),
    (3, 3);

INSERT INTO toilet_basin_brand_m2m
  (observation_id, basin_brand_id)
  VALUES
    (1, 2),
    (2, 1),
    (3, 2),
    (4, 1);

INSERT INTO toilet_basin_condition_m2m
  (observation_id, basin_condition_id)
  VALUES
    (1, 1),
    (4, 2);

INSERT INTO toilet_stall_condition_m2m
  (observation_id, stall_condition_id)
  VALUES
    (2, 2),
    (4, 2);

INSERT INTO toilet_sensor_condition_m2m
  (observation_id, sensor_condition_id)
  VALUES
    (1, 1),
    (2, 2);

/* Add toilet data for audit 2 */

INSERT INTO audit_toilet
  (observation_id, audit_id, gpf, date_conducted, location_id, commentary)
  VALUES
    (DEFAULT, 2, 2.4, '04-14-2020', 4,'Commentary on audited toilet 5'),
    (DEFAULT, 2, 2.4, '04-14-2020', 4,'Commentary on audited toilet 6'),
    (DEFAULT, 2, 3.2, '04-14-2020', 4,'Commentary on audited toilet 7');
  
INSERT INTO toilet_flushometer_brand_m2m
  (observation_id, flushometer_brand_id)
  VALUES
    (5, 2),
    (6, 2),
    (7, 2);

INSERT INTO toilet_flushometer_condition_m2m
  (observation_id, flushometer_condition_id)
  VALUES
    (7, 3);

INSERT INTO toilet_basin_brand_m2m
  (observation_id, basin_brand_id)
  VALUES
    (5, 1),
    (6, 1),
    (7, 1);

INSERT INTO toilet_basin_condition_m2m
  (observation_id, basin_condition_id)
  VALUES
    (5, 1),
    (6, 2);

INSERT INTO toilet_stall_condition_m2m
  (observation_id, stall_condition_id)
  VALUES
    (5, 1),
    (6, 2),
    (7, 1);

INSERT INTO toilet_sensor_condition_m2m
  (observation_id, sensor_condition_id)
  VALUES
    (5, 2);

/* Add toilet data for audit 3 */

INSERT INTO audit_toilet
  (observation_id, audit_id, gpf, date_conducted, location_id, commentary)
  VALUES
    (DEFAULT, 3, 1.3, '04-15-2020', 3,'Commentary on audited toilet 8'),
    (DEFAULT, 3, 1.2, '04-15-2020', 3,'Commentary on audited toilet 9');

INSERT INTO toilet_flushometer_brand_m2m
  (observation_id, flushometer_brand_id)
  VALUES
    (8, 1),
    (9, 1);

INSERT INTO toilet_flushometer_condition_m2m
  (observation_id, flushometer_condition_id)
  VALUES (8, 2);

INSERT INTO toilet_basin_brand_m2m
  (observation_id, basin_brand_id)
  VALUES
    (8, 1),
    (9, 2);

-- no bad basin or stall conditions

INSERT INTO toilet_sensor_condition_m2m
  (observation_id, sensor_condition_id)
  VALUES
    (9, 1);

/* Add toilet data for audit 4 */

INSERT INTO audit_toilet
  (observation_id, audit_id, gpf, date_conducted, location_id, commentary)
  VALUES
    (DEFAULT, 4, 1.3, '05-15-2020', 3,'Commentary on audited toilet 10');

INSERT INTO toilet_flushometer_brand_m2m
  (observation_id, flushometer_brand_id)
  VALUES
    (10, 1);

INSERT INTO toilet_basin_brand_m2m
  (observation_id, basin_brand_id)
  VALUES
    (10, 2);

-- no bad basin, stall, sensor, flushometer conditions

/* Add toilet data for audit 5 */

INSERT INTO audit_toilet
  (observation_id, audit_id, gpf, date_conducted, location_id, commentary)
  VALUES
    (DEFAULT, 5, 1.3, '05-25-2020', 2,'Commentary on audited toilet 11'),
    (DEFAULT, 5, 1.2, '05-25-2020', 2,'Commentary on audited toilet 12'),
    (DEFAULT, 5, 1.4, '05-25-2020', 2,'Commentary on audited toilet 13'),
    (DEFAULT, 5, 1.2, '05-25-2020', 2,'Commentary on audited toilet 14'),
    (DEFAULT, 5, 2.6, '05-25-2020', 4,'Commentary on audited toilet 15'),
    (DEFAULT, 5, 1.2, '05-25-2020', 4,'Commentary on audited toilet 16'),
    (DEFAULT, 5, 2.2, '05-25-2020', 4,'Commentary on audited toilet 17'),
    (DEFAULT, 5, 1.8, '05-25-2020', 4,'Commentary on audited toilet 18'),
    (DEFAULT, 5, 1.5, '05-25-2020', 4,'Commentary on audited toilet 19'),
    (DEFAULT, 5, 1.4, '05-25-2020', 4,'Commentary on audited toilet 20'),
    (DEFAULT, 5, 1.3, '05-26-2020', 3,'Commentary on audited toilet 21'),
    (DEFAULT, 5, 1.7, '05-26-2020', 3,'Commentary on audited toilet 22'),
    (DEFAULT, 5, 1.9, '05-26-2020', 3,'Commentary on audited toilet 23'),
    (DEFAULT, 5, 2.0, '05-26-2020', 3,'Commentary on audited toilet 24'),
    (DEFAULT, 5, 1.4, '05-26-2020', 3,'Commentary on audited toilet 25'),
    (DEFAULT, 5, 1.2, '05-26-2020', 3,'Commentary on audited toilet 26'),
    (DEFAULT, 5, 1.3, '05-26-2020', 3,'Commentary on audited toilet 27'),
    (DEFAULT, 5, 1.2, '05-26-2020', 3,'Commentary on audited toilet 28');

INSERT INTO toilet_flushometer_brand_m2m
  (observation_id, flushometer_brand_id)
  VALUES
    (11, 2),
    (12, 2),
    (13, 2),
    (14, 2),
    (15, 2),
    (16, 2),
    (17, 2),
    (18, 2),
    (19, 2),
    (20, 2),
    (21, 1),
    (22, 1),
    (23, 1),
    (24, 1),
    (25, 1),
    (26, 1),
    (27, 1),
    (28, 1);

INSERT INTO toilet_flushometer_condition_m2m
  (observation_id, flushometer_condition_id)
  VALUES
    (16, 1),
    (17, 1),
    (18, 2),
    (18, 1),
    (18, 3),
    (25, 1),
    (27, 2),
    (27, 3);

INSERT INTO toilet_basin_brand_m2m
  (observation_id, basin_brand_id)
  VALUES
    (11, 1),
    (12, 1),
    (13, 1),
    (14, 1),
    (15, 2),
    (16, 2),
    (17, 2),
    (18, 2),
    (19, 2),
    (20, 1),
    (21, 1),
    (22, 1),
    (23, 1),
    (24, 1),
    (25, 1),
    (26, 1),
    (27, 1),
    (28, 1);

INSERT INTO toilet_basin_condition_m2m
  (observation_id, basin_condition_id)
  VALUES
    (15, 1),
    (16, 1),
    (17, 2),
    (18, 1),
    (18, 2),
    (25, 1),
    (27, 2),
    (27, 1);

INSERT INTO toilet_stall_condition_m2m
  (observation_id, stall_condition_id)
  VALUES
    (11, 1),
    (12, 1),
    (14, 2),
    (16, 1),
    (18, 1),
    (25, 1),
    (27, 1),
    (27, 2);

INSERT INTO toilet_sensor_condition_m2m
  (observation_id, sensor_condition_id)
  VALUES
    (13, 1),
    (14, 2),
    (17, 1),
    (18, 2),
    (22, 1),
    (26, 2),
    (27, 1);