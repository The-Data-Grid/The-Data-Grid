CREATE TABLE item_building (
    item_id SERIAL PRIMARY KEY, 
	data_building_name TEXT NOT NULL,
    item_entity_id INTEGER NOT NULL, --fk **    
    location_region_id INTEGER NOT NULL, --fk **
    is_existing BOOLEAN NOT NULL,
    global_id INTEGER NOT NULL REFERENCES item_global, --fk ** (NOTE: Not in metadata because should not be included in the item requirement tree)
    UNIQUE(data_building_name, item_entity_id)
);

-- Entity, City, County, State, Country

CREATE TABLE item_entity (
    item_id SERIAL PRIMARY KEY,
    data_entity_name TEXT NOT NULL,
    data_entity_address TEXT NOT NULL,
    item_city_id INTEGER, --fk **
    UNIQUE(data_entity_name)
);

CREATE TABLE item_city (
    item_id SERIAL PRIMARY KEY,    
    data_city_name TEXT NOT NULL,
    data_population NUMERIC,
	item_county_id INTEGER NOT NULL, --fk **
    location_region_id INTEGER, --fk **
    location_point_id INTEGER, --fk **
    UNIQUE(item_county_id, data_city_name)
);

CREATE TABLE item_county (
    item_id SERIAL PRIMARY KEY,
	data_county_name TEXT NOT NULL,
    data_fips_code TEXT NOT NULL UNIQUE,    
	item_state_id INTEGER NOT NULL, --fk **
    location_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_county_name, item_state_id)
);

CREATE TABLE item_state (
    item_id SERIAL PRIMARY KEY,
    data_state_name TEXT NOT NULL,    
    item_country_id INTEGER NOT NULL, --fk **
	location_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_state_name, item_country_id)
);

CREATE TABLE item_country (
    item_id SERIAL PRIMARY KEY,
    data_country_name TEXT NOT NULL,
    location_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_country_name)
);

CREATE INDEX item_building_index
ON item_building (item_entity_id);

CREATE INDEX item_organization_index
ON item_organization (item_entity_id);

CREATE INDEX item_entity_index
ON item_entity (item_city_id);

CREATE INDEX item_city_index
ON item_city (item_county_id);

CREATE INDEX item_county_index
ON item_county (item_state_id);

CREATE INDEX item_state_index
ON item_state (item_country_id);

CREATE INDEX item_sop_index
ON item_sop (item_organization_id);

-- Building, Community, region
ALTER TABLE item_building ADD FOREIGN KEY (location_region_id) REFERENCES location_region;
ALTER TABLE item_building ADD FOREIGN KEY (item_entity_id) REFERENCES item_entity;

-- Uni, City, State, County, Country
ALTER TABLE item_entity ADD FOREIGN KEY (item_city_id) REFERENCES item_city;

ALTER TABLE item_city ADD FOREIGN KEY (item_county_id) REFERENCES item_county;
ALTER TABLE item_city ADD FOREIGN KEY (location_region_id) REFERENCES location_region;
ALTER TABLE item_city ADD FOREIGN KEY (location_point_id) REFERENCES location_point;

ALTER TABLE item_county ADD FOREIGN KEY (item_state_id) REFERENCES item_state;
ALTER TABLE item_county ADD FOREIGN KEY (location_region_id) REFERENCES location_region;

ALTER TABLE item_state ADD FOREIGN KEY (item_country_id) REFERENCES item_country;
ALTER TABLE item_state ADD FOREIGN KEY (location_region_id) REFERENCES location_region;

ALTER TABLE item_country ADD FOREIGN KEY (location_region_id) REFERENCES location_region;

INSERT INTO metadata_item
    (item_id, table_name, frontend_name, item_type, query_privilege, query_role, upload_privilege, upload_role)
        VALUES
            /*
                Privilege:
                    guest: 1
                    user: 2
                    superuser: 3
                Role:
                    auditor: 1
                    admin: 2
                Metadata Item Type:
                    observable: 1
                    potential-observable: 2
                    non-observable: 3
            */
            -- obs
            (DEFAULT, 'item_building', 'Building', 2, 1, null, 3, null),
            -- non-obs
            (DEFAULT, 'item_entity', 'Entity', 3, 1, null, 3, null),
            (DEFAULT, 'item_city', 'City', 3, 1, null, 3, null),
            (DEFAULT, 'item_county', 'County', 3, 1, null, 3, null),
            (DEFAULT, 'item_state', 'State', 3, 1, null, 3, null),
            (DEFAULT, 'item_country', 'Country', 3, 1, null, 3, null);

-- Calling insertion procedure
-- potential-observable
CALL "insert_m2m_metadata_item"('item_building', 'item_entity', TRUE, FALSE, 'Entity of Building', NULL);
-- non-observable
CALL "insert_m2m_metadata_item"('item_organization', 'item_entity', TRUE, FALSE, 'Entity of Organization', NULL);
CALL "insert_m2m_metadata_item"('item_entity', 'item_city', FALSE, TRUE, 'City of Entity', NULL);
CALL "insert_m2m_metadata_item"('item_city', 'item_county', TRUE, FALSE, 'County of City', NULL);
CALL "insert_m2m_metadata_item"('item_county', 'item_state', TRUE, FALSE, 'State of County', NULL);
CALL "insert_m2m_metadata_item"('item_state', 'item_country', TRUE, FALSE, 'Country of State', NULL);

-- History Tables
CALL "add_history_table"('item_building', TRUE);
CALL "add_history_table"('item_entity', TRUE);
CALL "add_history_table"('item_city', TRUE);
CALL "add_history_table"('item_county', TRUE);
CALL "add_history_table"('item_state', TRUE);
CALL "add_history_table"('item_country', TRUE);

-- Inserting Columns into metadata
CALL "insert_metadata_column"('data_entity_name', 'item_entity', NULL, NULL, 'item_entity', TRUE, FALSE, 'Entity Name', 'searchableDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id', 'text', TRUE);
CALL "insert_metadata_column"('data_entity_address', 'item_entity', NULL, NULL, 'item_entity', TRUE, FALSE, 'Entity Address', 'searchableDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-non-id', 'text', TRUE);
CALL "insert_metadata_column"('data_fips_code', 'item_county', NULL, NULL, 'item_county', TRUE, TRUE, 'FIPS County Code', 'numericEqual', NULL, 'string', 'Five digit number which uniquely identify counties and county equivalents', NULL, 'TEXT', 'item-non-id', 'wholeNumber', TRUE);
CALL "insert_metadata_column"('data_county_name', 'item_county', NULL, NULL, 'item_county', TRUE, FALSE, 'County Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id', 'text', TRUE);
CALL "insert_metadata_column"('data_country_name', 'item_country', NULL, NULL, 'item_country', TRUE, FALSE, 'Country Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id', 'text', TRUE);
CALL "insert_metadata_column"('data_building_name', 'item_building', NULL, NULL, 'item_building', TRUE, FALSE, 'Building Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id', 'text', TRUE);
CALL "insert_metadata_column"('data_population', 'item_city', NULL, NULL, 'item_city', TRUE, TRUE, 'City Population', 'numericEqual', NULL, 'string', NULL, NULL, 'NUMERIC', 'item-non-id', 'wholeNumber', TRUE);
CALL "insert_metadata_column"('data_city_name', 'item_city', NULL, NULL, 'item_city', TRUE, FALSE, 'City Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id', 'text', TRUE);
CALL "insert_metadata_column"('data_state_name', 'item_state', NULL, NULL, 'item_state', TRUE, FALSE, 'State Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id', 'text', TRUE);

-- Locations
-- Building
CALL "insert_metadata_column"('data_region', 'item_building', NULL, NULL, 'item_building', FALSE, FALSE, 'Building Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-non-id', 'geoRegion', TRUE);
-- City
CALL "insert_metadata_column"('data_region', 'item_city', NULL, NULL, 'item_city', FALSE, FALSE, 'City Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-non-id', 'geoRegion', TRUE);
CALL "insert_metadata_column"('data_point', 'item_city', NULL, NULL, 'item_city', FALSE, FALSE, 'City Geographic Point', NULL, NULL, 'location', NULL, NULL, 'Point', 'item-non-id', 'geoPoint', TRUE);
-- County
CALL "insert_metadata_column"('data_region', 'item_county', NULL, NULL, 'item_county', FALSE, FALSE, 'County Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-non-id', 'geoRegion', TRUE);
-- State
CALL "insert_metadata_column"('data_region', 'item_state', NULL, NULL, 'item_state', FALSE, FALSE, 'State Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-non-id', 'geoRegion', TRUE);
-- Country
CALL "insert_metadata_column"('data_region', 'item_country', NULL, NULL, 'item_country', FALSE, FALSE, 'Country Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-non-id', 'geoRegion', TRUE);