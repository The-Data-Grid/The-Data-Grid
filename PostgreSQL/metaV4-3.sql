/* ----------------------------------------------------------------------------------------------------------                                                                                                                                                   _______                                       
         _____                    _____                    _____          
        /\    \                  /\    \                  /\    \         
       /::\    \                /::\    \                /::\    \        
       \:::\    \              /::::\    \              /::::\    \       
        \:::\    \            /::::::\    \            /::::::\    \      
         \:::\    \          /:::/\:::\    \          /:::/\:::\    \     
          \:::\    \        /:::/  \:::\    \        /:::/  \:::\    \    
          /::::\    \      /:::/    \:::\    \      /:::/    \:::\    \   
         /::::::\    \    /:::/    / \:::\    \    /:::/    / \:::\    \  
        /:::/\:::\    \  /:::/    /   \:::\ ___\  /:::/    /   \:::\ ___\ 
       /:::/  \:::\____\/:::/____/     \:::|    |/:::/____/  ___\:::|    |
      /:::/    \::/    /\:::\    \     /:::|____|\:::\    \ /\  /:::|____|
     /:::/    / \/____/  \:::\    \   /:::/    /  \:::\    /::\ \::/    / 
    /:::/    /            \:::\    \ /:::/    /    \:::\   \:::\ \/____/  
   /:::/    /              \:::\    /:::/    /      \:::\   \:::\____\    
   \::/    /                \:::\  /:::/    /        \:::\  /:::/    /    
    \/____/                  \:::\/:::/    /          \:::\/:::/    /     
                              \::::::/    /            \::::::/    /      
                               \::::/    /              \::::/    /       
                                \::/____/                \::/____/        
                                 ~~                                       
   ----------------------------------------------------------------------------------------------------------
*/

-- The Data Grid Static Table Metadata Insertion Script --
-- Version 4-3 --

/*
    insert every static item table into metadata_item
    insert every static data_... column into metadata_column
    insert connections into metadata_item_m2m
    insert every submission tied data_... column into metadata_returnable
*/

-- Inserting static items into metadata_item

CREATE TABLE metadata_item (
    item_id SERIAL PRIMARY KEY,

    /*
    Actual table name
    */
    item_table_name TEXT NOT NULL,
    UNIQUE(item_table_name),

    /*
    Item type: observable (feature item), potential observable, non-observable
    */
    item_type INTEGER NOT NULL, --fk

    /*
    Privilege level needed to add a new item
    */
    creation_privilege TEXT NOT NULL
);

INSERT INTO metadata_item
    (item_table_name, item_type, creation_privilege)
        VALUES
            (SELECT 'item_room', type_id, 'Some Privilege' FROM metadata_item_type WHERE type_name = 'observable'),
            (SELECT 'item_building', type_id, 'Some Privilege' FROM metadata_item_type WHERE type_name = 'observable'),
            (),
            (),


-- Room, Building
CREATE TABLE item_room (
    item_id SERIAL PRIMARY KEY,
    data_room_number TEXT NOT NULL,
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
    UNIQUE (data_entity_name)
);

CREATE TABLE item_city (
    item_id SERIAL PRIMARY KEY,    
    data_city_name TEXT NOT NULL,
    data_population NUMERIC,
	item_county_id INTEGER NOT NULL, --fk **
    location_geom_region_id INTEGER, --fk **
    location_point_id INTEGER, --fk
    UNIQUE(item_county_id, data_city_name)
);

CREATE TABLE item_county (
    item_id SERIAL PRIMARY KEY,
	data_county_name TEXT NOT NULL,
    data_fips_code NUMERIC NOT NULL UNIQUE,    
	item_state_id INTEGER NOT NULL, --fk **
    location_geom_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_county_name, item_state_id)
);

CREATE TABLE item_state (
    item_id SERIAL PRIMARY KEY,
    data_state_name TEXT NOT NULL,    
    item_country_id INTEGER NOT NULL, --fk **
	location_geom_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_state_name, item_country_id)
);

CREATE TABLE item_country (
    item_id SERIAL PRIMARY KEY,
    data_country_name TEXT NOT NULL,
    location_geom_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_country_name)
);

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  
    data_organization_name_text TEXT NOT NULL,
    data_organization_name_link TEXT,
    item_entity_id INTEGER, --fk **
    UNIQUE(data_organization_name_text, item_entity_id)
);


