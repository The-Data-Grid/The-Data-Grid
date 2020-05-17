//statements here
"INSERT INTO loc (location_id, room_id) \
VALUES (DEFAULT, 2929); -- location_id is a SERIAL column"

"INSERT INTO audit_toilet (observation_id, gpf, date_conducted, location_id, commentary) \
VALUES (DEFAULT, 32, 'date', currval('loc_location_id_seq'), 'commentary');"
 //current value of SERIAL sequence in loc.location_id





// pg-promise here




