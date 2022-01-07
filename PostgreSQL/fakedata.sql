
-- Insert location
INSERT INTO location_point
    (location_id, data_point)
    VALUES
        (default, ST_GeomFromText('POINT(0 10)', 4326)),
        (default, ST_GeomFromText('POINT(5 5)', 4326)),
        (default, ST_GeomFromText('POINT(10 0)', 4326));


INSERT INTO location_region 
    (location_id, data_region)
        VALUES
            (default, ST_GeomFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0),(1 1, 1 2, 2 2, 2 1, 1 1))', 4326)),
            (default, ST_GeomFromText('POLYGON((0 5, 1 8, 1 10, 3 10, 0 5),(5 1, 5 2, 5 2, 2 5, 5 1))', 4326)),
            (default, ST_GeomFromText('POLYGON((0 10, 5 2, 4 3, 20 20, 0 10),(5 5, 2 2, 3 3, 4 4, 5 5))', 4326));


-- Insert item entity
INSERT INTO item_entity 
("item_id",
"data_entity_name",
"data_entity_address",
"item_city_id")
VALUES 
    (default, 'University of California, Los Angeles', 'Los Angeles, CA 90024', NULL),
    (default, 'University of Southern California', 'Los Angeles, CA 90007', NULL),
    (default, 'University of California, Berkeley', 'Berkeley, CA 94720', NULL);

-- org / user / role tree
INSERT INTO item_organization 
("item_id",
"data_organization_name_text",
"data_organization_name_link",
"item_entity_id")
VALUES
    (default, 'Bruin Home Solutions', 'bruinhomesolutions.com', 1),
    (default, 'Renewable Energy Association at UCLA', 'www.rea.seas.ucla.edu', 1);


INSERT INTO item_user 
("item_id",
"data_first_name",
"data_last_name",
"data_date_of_birth",
"data_email",
"tdg_p_hash",
"data_is_email_public",
"data_is_quarterly_updates",
"privilege_id")
VALUES
    (default, 'Oliver', 'Melgrove', 'Tue, 26 Jan 2021 21:53:05 GMT', 'oliver@melgrove.com', 'password', true, true, 3),
    (default, 'Tanya', 'Zhong', 'Tue, 26 Jan 2021 21:53:05 GMT', 'tanyazhong1@gmail.com', 'password', true, true, 3),
    (default, 'Kian', 'Nikzad', 'Tue, 26 Jan 2021 21:53:05 GMT', 'kian.nikzad@gmail.com', 'password', true, true, 3),
    (default, 'Jorden', 'Van Foreest', 'Tue, 26 Jan 2021 21:53:05 GMT', 'jorden-van-foreest@thedatagrid.org', '$2b$10$MWv9JnM4zD6TjnZlpSYC4upMdlGatnZxY9zDxKK/8BdTRjIho0p4S', true, true, 2);


INSERT INTO tdg_role 
("role_id",
"role_type_id",
"item_organization_id",
"item_user_id")
VALUES
    (default, 2, 2, 1),
    (default, 2, 1, 2),
    (default, 2, 1, 3);


-- audit_id, catalog_id, data_audit_name, user_id, data_time_created
INSERT INTO item_audit 
("item_id",
"data_audit_name",
"item_user_id",
"item_organization_id",
"data_time_created")
VALUES
    (default, 'Powell Sinks', 2, 1, NOW()),
    (default, 'YRL Sinks', 1, 1, NOW());


-- "submission_id", "item_audit_id", "item_organization_id", "item_user_id", "item_template_id", "data_time_submitted", "data_submission_name"
INSERT INTO item_global
("item_id", "item_audit_id", "item_organization_id", "item_user_id")
VALUES
    (default, 1, 1, 1),
    (default, 1, 1, 2),
    (default, 2, 1, 3),
    (default, 2, 1, 2);


-- actual features
INSERT INTO item_building 
("item_id",
"data_building_name",
"item_entity_id",
"global_id",
"is_existing",
"location_region_id")
VALUES
    (default, 'Powell Library', 1, 1, true, 1),
    (default, 'Young Research Library', 1, 1, true, 2),
    (default, 'Boelter Hall', 1, 2, true, 3);

INSERT INTO item_room 
("item_id",
"is_existing",
"item_building_id",
"data_room_number",
"data_exhaust_vent",
"global_id",
"data_access_panel")
VALUES
    (default, true, 1, '1234A', true, 2, false),
    (default, true, 1, '1235B', false, 2, false),
    (default, true, 1, '1236C', true, 2, true),
    (default, true, 1, '1237D', false, 2, true),

    (default, true, 2, '1234A', true, 2, false),
    (default, true, 2, '1235B', false, 2, false),
    (default, true, 2, '1236C', true, 2, true),
    (default, true, 2, '1237D', false, 2, true),

    (default, true, 3, '1234A', true, 2, false),
    (default, true, 3, '1235B', false, 2, false),
    (default, true, 3, '1236C', true, 2, true),
    (default, true, 3, '1237D', false, 2, true);

INSERT INTO attribute_sink_basin_brand
("attribute_id",
"data_attribute")
VALUES
    (default, 'Toyota'),
    (default, 'Ford'),
    (default, 'Tesla');

INSERT INTO attribute_sink_faucet_brand
("attribute_id",
"data_attribute")
VALUES
    (default, 'Lockheed Martin'),
    (default, 'Raytheon'),
    (default, 'Northrop Grumman');

INSERT INTO list_sink_basin_condition 
("list_id",
"data_element")
VALUES
    (default, 'Cracked'),
    (default, 'Dirty'),
    (default, 'Scratched');

INSERT INTO list_sink_faucet_condition 
("list_id",
"data_element")
VALUES
    (default, 'Shiny'),
    (default, 'Scratches'),
    (default, 'Rusty');

INSERT INTO list_sink_sensor_condition 
("list_id",
"data_element")
VALUES
    (default, 'Looks great'),
    (default, 'Partially occluded'),
    (default, 'Fully occluded');



--  id, exist, room_id, clockwise int, attr_basin_id, attr_fauc_id
INSERT INTO item_sink 
("item_id",
"is_existing",
"item_room_id",
"data_clockwise_integer",
"attribute_sink_basin_brand_id",
"global_id",
"attribute_sink_faucet_brand_id")
VALUES
    (default, true, 1, 1, 1, 3, 1),
    (default, true, 1, 2, 2, 3, 1),
    (default, true, 2, 1, 3, 3, 3),
    (default, true, 2, 2, 2, 3, 3),
    (default, true, 3, 1, 1, 3, 1),
    (default, true, 3, 2, 2, 3, 2),
    (default, true, 4, 1, 1, 3, 2),
    (default, true, 4, 2, 2, 3, 1),

    (default, true, 5, 1, 1, 3, 1),
    (default, true, 5, 2, 2, 3, 1),
    (default, true, 6, 1, 3, 3, 3),
    (default, true, 6, 2, 2, 3, 3),
    (default, true, 7, 1, 1, 3, 1),
    (default, true, 7, 2, 2, 3, 2),
    (default, true, 8, 1, 1, 3, 2),
    (default, true, 8, 2, 2, 3, 1),

    (default, true, 9, 1, 1, 3, 1),
    (default, true, 9, 2, 2, 3, 1),
    (default, true, 10, 1, 3, 4, 3),
    (default, true, 10, 2, 2, 4, 3),
    (default, true, 11, 1, 1, 4, 1),
    (default, true, 11, 2, 2, 4, 2),
    (default, true, 12, 1, 1, 4, 2),
    (default, true, 12, 2, 2, 4, 1);





/*********************
Observation based data
*/

INSERT INTO observation_sink 
("observation_id",
"observation_count_id",
"global_id",
"observableitem_id",
"data_time_conducted",
"data_commentary",
"data_auditor",
"data_gpm",
"attribute_sink_basin_brand_id",
"attribute_sink_faucet_brand_id")
VALUES
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 1, 1, NOW(), 'Nice Sink!', 'Sandra', 2.71828, 2, 3),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 1, 2, NOW(), 'Alright Sink.', 'Sandra', 3, 2, 2),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 1, 3, NOW(), 'Sink!', 'Sandra', 4, 1, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 1, 4, NOW(), 'Nice!', 'Sandra', 4.1828, 1, 2),

    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 2, 5, NOW(), NULL, 'Sandra', 7.28, 1, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 2, 6, NOW(), NULL, 'Sandra', 1.828, 3, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 2, 7, NOW(), NULL, 'Sandra', 3.71828, 3, 3),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 2, 8, NOW(), NULL, 'Sandra', 3.1415, 1, 2),

    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 9, NOW(), 'Nice Sink!', 'Mark', 2, 2, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 10, NOW(), 'Alright Sink.', 'Mark', 2.1, 2, 3),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 11, NOW(), 'Sink!', 'Mark', 2.3, 1, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 12, NOW(), 'Nice!', 'Mark', 2.909, 3, 2),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 13, NOW(), NULL, 'Mark', 4.88, 1, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 14, NOW(), NULL, 'Mark', 1.02, 3, 3),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 15, NOW(), NULL, 'Mark', 1.1, 3, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 16, NOW(), '1st', 'Mark', 2.9, 2, 3),

    -- different people observation the same sink
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 16, NOW(), '2nd', 'Juan', 1.02, 3, 3),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 16, NOW(), '3rd', 'Pablo', 1.1, 3, 1),
    (default, nextval('tdg_observation_count_observation_count_id_seq') - 1, 3, 16, NOW(), '4th', 'Jeremiah', 2.8, 2, 3);


INSERT INTO m2m_list_sink_faucet_condition
("observation_id",
"list_id")
VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 1),
(12, 2),
(13, 3),
(13, 1),
(4, 2),
(14, 3),
(15, 1),
(16, 3);
    
INSERT INTO m2m_list_sink_basin_condition
("observation_id",
"list_id")
VALUES
(1, 1),
(1, 2),
(11, 3),
(12, 1),
(12, 2),
(13, 3),
(13, 1),
(14, 2),
(14, 3),
(15, 1),
(16, 3);


INSERT INTO m2m_list_sink_sensor_condition
("observation_id",
"list_id")
VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 1),
(2, 2),
(3, 3),
(3, 1),
(4, 2),
(4, 3),
(5, 1),
(6, 3);


-- SOP
INSERT INTO item_sop
(item_id,
data_body,
data_name,
item_organization_id)
VALUES
(default, 'blah blah blah...', 'SOP1', 1),
(default, 'blah blah blah...', 'SOP2', 1),
(default, 'blah blah blah...', 'SOP3', 1);


INSERT INTO m2m_item_sop
(observation_count_id,
item_sop_id)
VALUES
(1, 1),
(1, 2),
(2, 1),
(3, 1),
(3, 2),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(13, 1),
(14, 2),
(14, 1),
(15, 1),
(16, 2);

