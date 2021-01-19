-- The Data Grid Database Creation Script --
-- Version 4-3 --

-- For GIS location handling
CREATE EXTENSION IF NOT EXISTS postgis;
-- For the crosstab() function
CREATE EXTENSION IF NOT EXISTS tablefunc;

/* ----------------------------------------------------------------------------------------------------------                                                                                                              
                                        ,,                                      ,,          ,,                   
    .M"""bgd   mm               mm      db               MMP""MM""YMM          *MM        `7MM                   
   ,MI    "Y   MM               MM                       P'   MM   `7           MM          MM                   
   `MMb.     mmMMmm   ,6"Yb.  mmMMmm  `7MM   ,p6"bo           MM       ,6"Yb.   MM,dMMb.    MM   .gP"Ya  ,pP"Ybd 
     `YMMNq.   MM    8)   MM    MM      MM  6M'  OO           MM      8)   MM   MM    `Mb   MM  ,M'   Yb 8I   `" 
   .     `MM   MM     ,pm9MM    MM      MM  8M                MM       ,pm9MM   MM     M8   MM  8M"""""" `YMMMa. 
   Mb     dM   MM    8M   MM    MM      MM  YM.    ,          MM      8M   MM   MM.   ,M9   MM  YM.    , L.   I8 
   P"Ybmmd"    `Mbmo `Moo9^Yo.  `Mbmo .JMML. YMbmd'         .JMML.    `Moo9^Yo. P^YbmdP'  .JMML. `Mbmmd' M9mmmP' 
*/ ----------------------------------------------------------------------------------------------------------       


-- Location

CREATE TABLE location_point (
    location_id SERIAL PRIMARY KEY,
    data_point geometry(Point, 4326) NOT NULL
);

CREATE TABLE location_region (
    location_id SERIAL PRIMARY KEY,
    data_region geometry(Polygon, 4326) NOT NULL
);

CREATE TABLE location_path (
    location_id SERIAL PRIMARY KEY,
    data_path geometry(LineString, 4326) NOT NULL
);


-- Room, Building

/*
in construct.js

CREATE TABLE item_room (
    item_id SERIAL PRIMARY KEY,
    data_room_number TEXT NOT NULL,
    item_building_id INTEGER NOT NULL --fk **
);
*/

CREATE TABLE item_building (
    item_id SERIAL PRIMARY KEY, 
	data_building_name TEXT NOT NULL,
    item_entity_id INTEGER NOT NULL, --fk **    
    location_region_id INTEGER NOT NULL, --fk **
    UNIQUE(data_building_name, item_entity_id)
);


-- Organization, Entity, City, County, State, Country

CREATE TABLE item_entity (
    item_id SERIAL PRIMARY KEY,
    data_entity_name TEXT NOT NULL,
    data_entity_address TEXT NOT NULL,
    item_city_id INTEGER NOT NULL, --fk **
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
    data_fips_code NUMERIC NOT NULL UNIQUE,    
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

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  
    data_organization_name_text TEXT NOT NULL,
    data_organization_name_link TEXT,
    item_entity_id INTEGER NOT NULL, --fk **
    UNIQUE(data_organization_name_text, item_entity_id)
);


-- Observation supertable, SOP and User which reference it

CREATE TABLE tdg_observation_count (
    observation_count_id SERIAL PRIMARY KEY
);

CREATE TABLE item_sop (
    item_id SERIAL PRIMARY KEY, 
    tdg_filepath TEXT NOT NULL,
    data_name TEXT NOT NULL,
    data_time_uploaded TIMESTAMPTZ NOT NULL,
    item_organization_id INTEGER NOT NULL --fk **
);

CREATE TABLE m2m_item_sop (
    observation_count_id INTEGER NOT NULL, --fk **
    item_sop_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_template (
    item_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER NOT NULL, --fk **
    item_user_id INTEGER NOT NULL, --fk **
    data_template_name TEXT,
    data_template_json JSONB NOT NULL
);

CREATE TABLE m2m_auditor (
    observation_count_id INTEGER NOT NULL, --fk **
    item_user_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_user (
    item_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER NOT NULL, --fk **
    data_full_name TEXT NOT NULL,
    data_email TEXT NOT NULL,
    tdg_p_hash TEXT NOT NULL,
    data_is_email_public BOOLEAN NOT NULL,
    data_is_quarterly_updates BOOLEAN NOT NULL,
    UNIQUE(data_email)
);

CREATE TABLE m2m_user_organization (
    item_user_id INTEGER NOT NULL, --fk **
    organization_id INTEGER NOT NULL --fk **
);


-- Submission

CREATE TABLE item_submission (
    submission_id SERIAL PRIMARY KEY,
    item_audit_id INTEGER NOT NULL, --fk **
    item_organization_id INTEGER NOT NULL, --fk ** org that user is submitting as, id will be given by session
    item_user_id INTEGER NOT NULL, --fk **
    item_template_id INTEGER, --fk ** ???
    data_time_submitted TIMESTAMPTZ NOT NULL,
    data_submission_name TEXT
);

CREATE TABLE tdg_submission_edit (
    submission_edit_id SERIAL PRIMARY KEY,
    item_submission_id INTEGER NOT NULL, --fk **
    item_user_id INTEGER NOT NULL, --fk **
    data_time_edited TIMESTAMPTZ NOT NULL
);

CREATE TABLE tdg_observation_edit (
    observation_edit_id SERIAL PRIMARY KEY,
    observation_count_id INTEGER NOT NULL, --fk **
    submission_edit_id INTEGER NOT NULL, --fk **
    data_edit_description TEXT
);

CREATE TABLE m2m_tdg_assigned_auditor (
    item_audit_id SERIAL PRIMARY KEY, --fk **
    item_user_id INTEGER NOT NULL, --fk **
    user_instructions TEXT
);

CREATE TABLE item_catalog (
    item_id SERIAL PRIMARY KEY,
    data_title TEXT NOT NULL,
    data_description TEXT,
    is_discoverable BOOLEAN NOT NULL
);

CREATE TABLE item_audit (
    item_id SERIAL PRIMARY KEY,
    item_catalog_id INTEGER, --fk **
    data_audit_name TEXT,
    item_user_id INTEGER NOT NULL, --fk **
    data_time_created TIMESTAMPTZ NOT NULL
);

-- Privilege

/* Scratched this for now, probably won't need

CREATE TABLE tdg_operation (
    operation_id SERIAL PRIMARY KEY,
    operation_name TEXT NOT NULL
);

CREATE TABLE m2m_tdg_operation (
    privilege_id INTEGER NOT NULL, --fk **
    operation_id INTEGER NOT NULL --fk **
);

ALTER TABLE m2m_tdg_operation ADD FOREIGN KEY (privilege_id) REFERENCES tdg_privilege;
ALTER TABLE m2m_tdg_operation ADD FOREIGN KEY (operation_id) REFERENCES tdg_operation;
*/

CREATE TABLE tdg_privilege (
    privilege_id SERIAL PRIMARY KEY,
    privilege_name TEXT NOT NULL
);

INSERT INTO tdg_privilege 
    (privilege_id, privilege_name)
        VALUES 
            (DEFAULT, 'guest'),
            (DEFAULT, 'user'),
            (DEFAULT, 'auditor'),
            (DEFAULT, 'admin'),
            (DEFAULT, 'superuser');

CREATE TABLE tdg_role (
    role_id SERIAL PRIMARY KEY,
    privilege_id INTEGER NOT NULL, --fk **
    item_organization_id INTEGER NOT NULL, --fk **
    item_user_id INTEGER NOT NULL --fk **
    -- Constraint: privilege 'superuser' must only be associated with TDG org
    -- Note: TDG must be the first organization added in the database for now! (must have PK = 1)
    CHECK((privilege_id = 5 AND item_organization_id = 1) OR (privilege_id != 5))
);



/* ----------------------------------------------------------------------------------------------------------                                                                                                                                                   _______                                       
                                                    ,,                            
   `7MMM.     ,MMF'           mm                  `7MM             mm             
     MMMb    dPMM             MM                    MM             MM             
     M YM   ,M MM   .gP"Ya  mmMMmm   ,6"Yb.    ,M""bMM   ,6"Yb.  mmMMmm   ,6"Yb.  
     M  Mb  M' MM  ,M'   Yb   MM    8)   MM  ,AP    MM  8)   MM    MM    8)   MM  
     M  YM.P'  MM  8M""""""   MM     ,pm9MM  8MI    MM   ,pm9MM    MM     ,pm9MM  
     M  `YM'   MM  YM.    ,   MM    8M   MM  `Mb    MM  8M   MM    MM    8M   MM  
   .JML. `'  .JMML. `Mbmmd'   `Mbmo `Moo9^Yo. `Wbmd"MML.`Moo9^Yo.  `Mbmo `Moo9^Yo. 
   ----------------------------------------------------------------------------------------------------------
*/

/*
The way that the data column is related to its item. Important for joining the column
as well creating the table and columns inside construct.js
*/
CREATE TABLE metadata_reference_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

/*
Reference Type Information

item-id
    - Identifying data column of an item
    ex: item_room > data_room_number
item-non-id
    - Non Identifying data column of an item
    ex: item_building > data_color
item-list
    - Static data column associated with an item through a many to many relationship which
      can take on multiple values at a time
    ex: (no example with current audit schema)
item-factor
    - Static data column associated with an item through a one to many relationship. Exactly
      the same as a list except cannot take multiple values at a time
    ex: (no example with current audit schema)
item-location
    - Static data column *of an item* which strictly contains a geographic location associated with an item.
      Note that these are specific to a certain item
    ex: location_region > data_region (region of building) is different than:
        location_region > data_region (region of state)
obs
    - Observational data column within an observation_... table
    ex: feature_toilet > data_gpf
obs-global
    - Observational data column within all observation_... tables
    ex: feature_... > data_time_conducted
obs-list
    - Observational data column associated with an observation_... table through a many to many
      relationship which can take on multiple values at a time
    ex: list_toilet_flushometer_condition > data_element 
obs-factor
    - Observational data column associated with an observation_... table through a one to many
      relationship. Exactly the same as a list except cannot take multiple values at a time
    ex: (no example with current audit schema)
special
    - Special data column that may contain multiple actual columns and requires special treatment
    ex: (there are two)
        SOP Name: joined to observation_count instead of feature_... table
        Auditor Name: is a coalesce between two data columns in different tables
attribute
    - Associated with the feature_... table AND the item table, meant to change rarely with the current
      value being the item reference and the observed value being the feature reference
    ex: attribute_toilet_flushometer_brand > data_name
*/
INSERT INTO metadata_reference_type
    (type_id, type_name)
    VALUES
        (DEFAULT, 'item-id'),
        (DEFAULT, 'item-non-id'),
        (DEFAULT, 'item-list'),
        (DEFAULT, 'item-location'),
        (DEFAULT, 'item-factor'),
        (DEFAULT, 'obs'),
        (DEFAULT, 'obs-global'),
        (DEFAULT, 'obs-list'),
        (DEFAULT, 'obs-factor'),
        (DEFAULT, 'special'),
        (DEFAULT, 'attribute');
        

/*
Type of UI data input / filtering selectors displayed in frontend
*/
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
        (DEFAULT, 'INTEGER'),
        (DEFAULT, 'TIMESTAMPTZ'),
        (DEFAULT, 'BOOLEAN'),
        (DEFAULT, 'JSON'),
        (DEFAULT, 'Point'),
        (DEFAULT, 'LineString'),
        (DEFAULT, 'Polygon');

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
		(DEFAULT, 'location', 'JSONB object representing geographic location (point, path or region)');

CREATE TABLE metadata_item_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_item_type 
    (type_id, type_name)
    VALUES
        (DEFAULT, 'observable'),
        (DEFAULT, 'potential-observable'),
        (DEFAULT, 'non-observable');

/*
Child-Parent item relationships. The is_id column specifies whether the child item is needed to identify
The parent.
*/
CREATE TABLE m2m_metadata_item (
    m2m_id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL, --fk **
    referenced_item_id INTEGER NOT NULL, --fk **
    is_id BOOLEAN NOT NULL,
    is_nullable BOOLEAN NOT NULL,
    frontend_name TEXT,
    information TEXT,
    -- Can't be ID and Nullable
    CHECK(NOT (is_id = TRUE AND is_nullable = TRUE))
);

/*
All item_... tables
*/
CREATE TABLE metadata_item (
    item_id SERIAL PRIMARY KEY,

    /*
    Actual table name
    */
    table_name TEXT NOT NULL,

    /*
    Name of item displayed in frontend
    */
    frontend_name TEXT NOT NULL,
    
    /*
    Item type: observable (feature item), potential observable, non-observable
    */
    item_type INTEGER NOT NULL, --fk **

    /*
    Privilege level needed to add a new item. There are only 5 privileges
    */
    creation_privilege INTEGER NOT NULL CHECK(creation_privilege BETWEEN 1 AND 5),
    UNIQUE(table_name)
);


/*
All data_... columns. These are either in 
item_..., location_..., feature_..., subfeature_..., list_..., or tdg_... tables
*/
CREATE TABLE metadata_column (
    column_id SERIAL PRIMARY KEY,
    
    /*
    Actual column and table name
    Unique unless reference_type is 'item-location'
    */
    column_name TEXT NOT NULL,
    table_name TEXT NOT NULL,

    /*
    The name of the observation table the column is in or is referenced by, if it is
    */
    observation_table_name TEXT,

    /*
    The name of the subobservation table the column is in or is referenced by, if it is
    */
    subobservation_table_name TEXT,

    -- Can't be in an observation and subobservation table
    CHECK(NOT (observation_table_name IS NOT NULL AND subobservation_table_name IS NOT NULL)),

    /*
    Item that is related to this column. Note this isn't strictly the item that the data column is in,
    lists and local columns are still related to their feature's observable item. For location There
    are multiple items which use the same table and column 
    */
    metadata_item_id INTEGER NOT NULL, --fk **

    /*
    For frontend
    */
    is_default BOOLEAN NOT NULL,
    is_nullable BOOLEAN NOT NULL,
    frontend_name TEXT NOT NULL,
    filter_selector INTEGER, --fk **
    input_selector INTEGER, --fk **
    frontend_type INTEGER NOT NULL, --fk **
    information TEXT,
    accuracy TEXT,

    /*
    For backend
    */
    sql_type INTEGER NOT NULL, --fk **
    reference_type INTEGER NOT NULL --fk **
);

-- Partially Unique Indices because there are column-table repeats for location and special
DO
$$
    DECLARE
        location_reference_type_id INTEGER := (SELECT type_id FROM metadata_reference_type WHERE type_name = 'item-location');
        special_reference_type_id INTEGER := (SELECT type_id FROM metadata_reference_type WHERE type_name = 'special');
    BEGIN
        
        -- When not location unique on column-table
        EXECUTE FORMAT('CREATE UNIQUE INDEX col_tab_loc ON metadata_column (column_name, table_name) WHERE (
            reference_type NOT IN (%L, %L)
        )', location_reference_type_id, special_reference_type_id);

        -- When location unique on column-table-item
        EXECUTE FORMAT('CREATE UNIQUE INDEX col_tab_no_loc ON metadata_column (column_name, table_name, metadata_item_id) WHERE (
            reference_type IN (%L , %L)
        )', location_reference_type_id, special_reference_type_id);
        
    END
$$;

/*
All returnable columns. This is different than data_... columns because they are specific to a certain
feature. For example there is one row in metadata_column for the data_room_number column of the item_room
table, but there are five rows in metadata_returnable for the data_room_number column of the item_room
table because it is a data column for each of the five features.
*/
CREATE TABLE metadata_returnable (
    returnable_id SERIAL PRIMARY KEY, -- used as the returnableID

    /*
    The associated data column in metadata_column. This is required because it contains all of the actual
    metadata for the column.
    */
    column_id INTEGER NOT NULL, --fk **

    /*
    NULL if the item of the associated metadata_column is 'item_submission'
    */
    feature_id INTEGER, --fk **

    /*
    The root feature for this subfeature, NULL if not subfeature or if item is 'item_submission'
    */ 
    rootfeature_id INTEGER, --fk **

    /*
    Display name for returnable. Usually has an identical name to its metadata_column, but
    in some special cases it's different. (attributes)
    */
    frontend_name TEXT NOT NULL,

    /*
    Do we want to use this returnable? Returnables are just a representation of the actual data,
    so not all representations are always wanted. This is by default true and then changed with
    the contruct CLI
    */
    is_used BOOLEAN NOT NULL,

    /*
    Arrays of table and columns needed to make the join to the column. These are different 
    for different returnables that reference the same metadata_column! This is the whole point, 
    The same data_... column is joined and treated differently in backend depending on the
    feature that references it
    format (arrays must come in sets of two):
        {
            columns: Array,
            tables: Array,
            attributeType: null | 'current' | 'observed'
        }
    */
    join_object JSON NOT NULL,

    /*
    Specifies if this returnable is the standard geographic location for the feature.
    */
    is_real_geo BOOLEAN NOT NULL
);


/*
Contains the information on the various features and subfeatures. This includes the heirarchy
information as well as the other frontend metadata requirements.
*/
CREATE TABLE metadata_feature (
    feature_id SERIAL PRIMARY KEY,

    /*
    Actual table name (observation_... or subobservation_...)
    */
    table_name TEXT NOT NULL,

    /*
    This feature's observable item. NULL for subfeatures.
    */
    observable_item_id INTEGER, --fk **

    /*
    Self referencing foreign key that specifies the parent feature. Note that this is only
    NOT NULL for subfeatures.
    */
    parent_id INTEGER --fk **

    -- Sanity check
    CHECK((observable_item_id IS NULL AND parent_id IS NOT NULL) OR (observable_item_id IS NOT NULL AND parent_id IS NULL)),

    /*
    direct to REST API numFeatureRange
    numFeatureRange is the allowable number of instantiations of a subfeature for its parent (is only non-NULL for subfeatures)
    */
    num_feature_range INTEGER,

    -- Sanity check
    CHECK(num_feature_range > 0),

    /*
    Frontend metadata
    */
    information TEXT,
    frontend_name TEXT NOT NULL
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

insert into users 
    (
        id,
        name,
        email,
        password,
        role
    )
    values 
        (default, 'veronica', 'veronica@gmail.com', 'example', 'user'),
        (default, 'edward', 'ed@gmail.com', 'example', 'superuser');


/* ----------------------------------------------------------------------------------------------------------                                                                                                          
                                         ,,                                                                     
`7MM"""YMM                               db                            `7MMF' `YMM'                             
  MM    `7                                                               MM   .M'                               
  MM   d    ,pW"Wq.  `7Mb,od8  .gP"Ya  `7MM   .P"Ybmmm `7MMpMMMb.        MM .d"      .gP"Ya  `7M'   `MF',pP"Ybd 
  MM""MM   6W'   `Wb   MM' "' ,M'   Yb   MM  :MI  I8     MM    MM        MMMMM.     ,M'   Yb   VA   ,V  8I   `" 
  MM   Y   8M     M8   MM     8M""""""   MM   WmmmP"     MM    MM        MM  VMA    8M""""""    VA ,V   `YMMMa. 
  MM       YA.   ,A9   MM     YM.    ,   MM  8M          MM    MM        MM   `MM.  YM.    ,     VVV    L.   I8 
.JMML.      `Ybmd9'  .JMML.    `Mbmmd' .JMML. YMMMMMb  .JMML  JMML.    .JMML.   MMb. `Mbmmd'     ,V     M9mmmP' 
                                             6'     dP                                          ,V              
                                             Ybmmmd'                                         OOb"               
*/ ----------------------------------------------------------------------------------------------------------


-- Metadata
ALTER TABLE metadata_feature ADD FOREIGN KEY (parent_id) REFERENCES metadata_feature (feature_id);
ALTER TABLE metadata_feature ADD FOREIGN KEY (observable_item_id) REFERENCES metadata_item;
ALTER TABLE metadata_feature ADD FOREIGN KEY (parent_id) REFERENCES metadata_feature (feature_id);

ALTER TABLE metadata_returnable ADD FOREIGN KEY (column_id) REFERENCES metadata_column;
ALTER TABLE metadata_returnable ADD FOREIGN KEY (feature_id) REFERENCES metadata_feature;
ALTER TABLE metadata_returnable ADD FOREIGN KEY (rootfeature_id) REFERENCES metadata_feature;

ALTER TABLE metadata_column ADD FOREIGN KEY (metadata_item_id) REFERENCES metadata_item;
ALTER TABLE metadata_column ADD FOREIGN KEY (filter_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (input_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (frontend_type) REFERENCES metadata_frontend_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (sql_type) REFERENCES metadata_sql_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (reference_type) REFERENCES metadata_reference_type;

ALTER TABLE m2m_metadata_item ADD FOREIGN KEY (item_id) REFERENCES metadata_item;
ALTER TABLE m2m_metadata_item ADD FOREIGN KEY (referenced_item_id) REFERENCES metadata_item;

ALTER TABLE metadata_item ADD FOREIGN KEY (item_type) REFERENCES metadata_item_type;


-- Room, Building, Community, region
--ALTER TABLE item_room ADD FOREIGN KEY (item_building_id) REFERENCES item_building;
ALTER TABLE item_building ADD FOREIGN KEY (location_region_id) REFERENCES location_region;
ALTER TABLE item_building ADD FOREIGN KEY (item_entity_id) REFERENCES item_entity;
ALTER TABLE item_organization ADD FOREIGN KEY (item_entity_id) REFERENCES item_entity;


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


-- Submission
ALTER TABLE item_submission ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE item_submission ADD FOREIGN KEY (item_template_id) REFERENCES item_template;
ALTER TABLE item_submission ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE item_submission ADD FOREIGN KEY (item_audit_id) REFERENCES item_audit (item_id);

ALTER TABLE tdg_submission_edit ADD FOREIGN KEY (item_submission_id) REFERENCES item_submission;
ALTER TABLE tdg_submission_edit ADD FOREIGN KEY (item_user_id) REFERENCES item_user;

ALTER TABLE tdg_observation_edit ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count;
ALTER TABLE tdg_observation_edit ADD FOREIGN KEY (submission_edit_id) REFERENCES tdg_submission_edit;


-- SOP
ALTER TABLE m2m_item_sop ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count;
ALTER TABLE m2m_item_sop ADD FOREIGN KEY (item_sop_id) REFERENCES item_sop;
ALTER TABLE item_sop ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;


-- Template
ALTER TABLE item_template ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE item_template ADD FOREIGN KEY (item_user_id) REFERENCES item_user;


-- Auditor
ALTER TABLE m2m_auditor ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE m2m_auditor ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count;


-- Audit
ALTER TABLE m2m_tdg_assigned_auditor ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE m2m_tdg_assigned_auditor ADD FOREIGN KEY (item_audit_id) REFERENCES item_audit;

ALTER TABLE item_audit ADD FOREIGN KEY (item_catalog_id) REFERENCES item_catalog;
ALTER TABLE item_audit ADD FOREIGN KEY (item_user_id) REFERENCES item_user;


-- Users, Privilege, Organization
ALTER TABLE tdg_role ADD FOREIGN KEY (privilege_id) REFERENCES tdg_privilege;
ALTER TABLE tdg_role ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE tdg_role ADD FOREIGN KEY (item_user_id) REFERENCES item_user;

ALTER TABLE m2m_user_organization ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE m2m_user_organization ADD FOREIGN KEY (organization_id) REFERENCES item_organization;

ALTER TABLE item_user ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;


                                                                                
/* ----------------------------------------------------------------------------------------------------------
`7MM"""YMM                                mm     db                             
  MM    `7                                MM                                    
  MM   d `7MM  `7MM  `7MMpMMMb.  ,p6"bo mmMMmm `7MM  ,pW"Wq.`7MMpMMMb.  ,pP"Ybd 
  MM""MM   MM    MM    MM    MM 6M'  OO   MM     MM 6W'   `Wb MM    MM  8I   `" 
  MM   Y   MM    MM    MM    MM 8M        MM     MM 8M     M8 MM    MM  `YMMMa. 
  MM       MM    MM    MM    MM YM.    ,  MM     MM YA.   ,A9 MM    MM  L.   I8 
.JMML.     `Mbod"YML..JMML  JMML.YMbmd'   `Mbmo.JMML.`Ybmd9'.JMML  JMML.M9mmmP' 
*/ ----------------------------------------------------------------------------------------------------------
-- Version 4-3 --

/*
    1. insert every static item table into metadata_item
    2. insert connections into m2m_metadata_item
    3. insert every static data_... column into metadata_column
    **4. insert every submission tied data_... column into metadata_returnable (returnable generation is automated)
*/

-- 2. insert relations into m2m_metadata_item
-- Insertion Function
CREATE PROCEDURE insert_m2m_metadata_item(observable_item TEXT, 
                                         referenced TEXT, 
                                         isID BOOLEAN,
                                         isNullable BOOLEAN,
                                         frontendName TEXT,
                                         information TEXT)
    AS 
    $$
        BEGIN
            
            INSERT INTO m2m_metadata_item
                (m2m_id,
                item_id, 
                referenced_item_id, 
                is_id,
                is_nullable,
                frontend_name,
                information)
                    VALUES (
                        DEFAULT,
                        (SELECT item_id FROM metadata_item WHERE table_name = observable_item),
                        (SELECT item_id FROM metadata_item WHERE table_name = referenced),
                        isID,
                        isNullable,
                        frontendName,
                        information
                    );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;


CREATE FUNCTION add_item_to_item_reference(observable_item regclass, 
                                           referenced regclass,
                                           isID BOOLEAN,
                                           isNullable BOOLEAN)
    RETURNS TEXT
    AS
    $$
        DECLARE
            required_item_column TEXT := concat(referenced, '_id');
        BEGIN
            -- Can't be ID and Nullable. This is also a table check constraint
            IF isID = TRUE AND isNullable = TRUE THEN
                RAISE EXCEPTION 'Item cannot be an ID and be nullable';
            END IF;

            IF isNullable = FALSE THEN
                -- Add the foreign key column to the item with the NOT NULL constraint
                EXECUTE FORMAT('ALTER TABLE %I
                                ADD COLUMN %I INTEGER NOT NULL', observable_item, required_item_column);
            ELSE
                -- Add the foreign key column to the item without the NOT NULL constraint
                EXECUTE FORMAT('ALTER TABLE %I
                                ADD COLUMN %I INTEGER', observable_item, required_item_column);
            END IF;

            -- Add the foreign key constraint
            EXECUTE FORMAT('ALTER TABLE %I
                            ADD FOREIGN KEY (%I)
                            REFERENCES %I ("item_id")', observable_item, required_item_column, referenced);
        
            -- Return the id-column
            RETURN required_item_column;
        END
    $$ LANGUAGE plpgsql;

-- 3. insert every static data_... column into metadata_column
-- Insertion Function
CREATE PROCEDURE insert_metadata_column(column_name TEXT, 
                                       table_name_ TEXT, 
                                       observation_table_name TEXT, 
                                       subobservation_table_name TEXT,
                                       item_table_name TEXT,
                                       is_default BOOLEAN,
                                       is_nullable BOOLEAN,
                                       frontend_name TEXT,
                                       filter_selector_name TEXT,
                                       input_selector_name TEXT,
                                       frontend_type_name TEXT,
                                       information TEXT,
                                       accuracy TEXT,
                                       sql_type_name TEXT,
                                       reference_type_name TEXT)
    AS
    $$
        BEGIN
            INSERT INTO metadata_column
                (column_id, 
                column_name, 
                table_name,
                observation_table_name,
                subobservation_table_name,
                metadata_item_id, 
                is_default, 
                is_nullable, 
                frontend_name, 
                filter_selector, 
                input_selector,
                frontend_type,
                information,
                accuracy,
                sql_type,
                reference_type)
                VALUES (
                    DEFAULT,
                    column_name,
                    table_name_,
                    observation_table_name,
                    subobservation_table_name,
                    (SELECT item_id FROM metadata_item WHERE "table_name" = item_table_name),
                    is_default,
                    is_nullable,
                    frontend_name,
                    (SELECT selector_id FROM metadata_selector WHERE selector_name = filter_selector_name),
                    (SELECT selector_id FROM metadata_selector WHERE selector_name = input_selector_name),
                    (SELECT type_id FROM metadata_frontend_type WHERE type_name = frontend_type_name),
                    information,
                    accuracy,
                    (SELECT type_id FROM metadata_sql_type WHERE type_name = sql_type_name),
                    (SELECT type_id FROM metadata_reference_type WHERE type_name = reference_type_name)
                );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;



-- Insert a feature into metadata_feature
CREATE PROCEDURE insert_metadata_feature(_table_name TEXT,
                                        item_table_name TEXT,
                                        information TEXT,
                                        frontend_name TEXT)
    AS
    $$
        BEGIN
            IF _table_name NOT LIKE 'observation\_%' THEN
                RAISE EXCEPTION 'Root Features must follow the naming convention ''observation_...''';
            END IF;
            INSERT INTO metadata_feature
                (feature_id,
                table_name,
                observable_item_id,
                information,
                frontend_name)
                VALUES (
                    DEFAULT,
                    _table_name,
                    (SELECT item_id FROM metadata_item AS m WHERE m.table_name = item_table_name),
                    information,
                    frontend_name
                );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Insert a subfeature into metadata_feature
CREATE PROCEDURE insert_metadata_subfeature(_table_name TEXT,
                                           parent_table_name TEXT,
                                           num_feature_range INTEGER,
                                           information TEXT,
                                           frontend_name TEXT)
    AS
    $$
        BEGIN
            IF _table_name NOT LIKE 'subobservation\_%' THEN
                RAISE EXCEPTION 'Subfeatures must follow the naming convention ''subobservation_...''';
            END IF;
            INSERT INTO metadata_feature
                (feature_id,
                table_name,
                parent_id,
                num_feature_range,
                information,
                frontend_name)
                VALUES (
                    DEFAULT,
                    _table_name,
                    (SELECT feature_id FROM metadata_feature AS f WHERE f.table_name = parent_table_name),
                    num_feature_range,
                    information,
                    frontend_name
                );
            
            COMMIT;
        END
    $$ LANGUAGE plpgsql;


-- Inserts a new observable item into metadata_item
CREATE PROCEDURE insert_metadata_item_observable(item TEXT, frontend_name TEXT, creation_privilege INTEGER)
    AS
    $$
        BEGIN
            INSERT INTO metadata_item
                (item_id,
                table_name,
                frontend_name,
                item_type, 
                creation_privilege)
                VALUES (
                    DEFAULT, 
                    item,
                    frontend_name,
                    (SELECT type_id FROM metadata_item_type WHERE type_name = 'observable'),
                    creation_privilege
                );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Inserts a new returnable into metadata_returnable without join_object or frontend_name
CREATE FUNCTION insert_metadata_returnable(column_id INTEGER, 
                                          feature_id INTEGER, 
                                          rootfeature_id INTEGER,
                                          frontend_name TEXT,
                                          is_used BOOLEAN,
                                          join_object JSON,
                                          is_real_geo BOOLEAN)
    RETURNS TABLE (returnableid INTEGER)
    AS
    $$
        BEGIN
            RETURN QUERY
            INSERT INTO metadata_returnable
                (returnable_id,
                column_id,
                feature_id,
                rootfeature_id,
                frontend_name,
                is_used,
                join_object,
                is_real_geo)
                VALUES (
                    DEFAULT,
                    column_id,
                    feature_id,
                    rootfeature_id,
                    frontend_name,
                    is_used,
                    join_object,
                    is_real_geo
                )
            RETURNING returnable_id AS returnableid;
        END
    $$ LANGUAGE plpgsql;

-- update frontend_name and is_used on metadata_returnable
CREATE PROCEDURE update_metadata_returnable(returnable_id INTEGER, frontend_name TEXT, is_used BOOLEAN)
    AS
    $$
        BEGIN
            UPDATE metadata_returnable SET
                frontend_name = frontend_name,
                is_used = is_used
                WHERE returnable_id = returnable_id;
        END
    $$ LANGUAGE plpgsql;


CREATE PROCEDURE create_observation_table(table_name TEXT)
    AS
    $$
        DECLARE
            observable_item regclass := regexp_replace(table_name, '^observation', 'item');
        BEGIN
            -- Create the table
            EXECUTE FORMAT('CREATE TABLE %I (
                            observation_id SERIAL PRIMARY KEY,
                            observation_count_id INTEGER NOT NULL,
                            submission_id INTEGER NOT NULL,
                            observableitem_id INTEGER NOT NULL)', table_name);
            
            -- Observation Count reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("observation_count_id")
                            REFERENCES "tdg_observation_count" ("observation_count_id")', table_name);
        
            -- Submission reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("submission_id")
                            REFERENCES "item_submission" ("submission_id")', table_name);
            
            -- Observable Item reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("observableitem_id")
                            REFERENCES %I ("item_id")', table_name, observable_item);

            COMMIT;
        END
    $$ LANGUAGE plpgsql;


CREATE PROCEDURE create_subobservation_table(table_name TEXT, parent_table_name regclass)
    AS
    $$
        BEGIN
            -- Create the table
            EXECUTE FORMAT('CREATE TABLE %I (
                            observation_id SERIAL PRIMARY KEY,
                            observation_count_id INTEGER NOT NULL,
                            parent_id INTEGER NOT NULL)', table_name);
            
            -- Parent feature reference
            EXECUTE FORMAT('ALTER TABLE %I
                            ADD FOREIGN KEY ("parent_id")
                            REFERENCES %I ("observation_id")', table_name, parent_table_name);

            -- Observation Count reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("observation_count_id")
                            REFERENCES "tdg_observation_count" ("observation_count_id")', table_name);

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE FUNCTION create_observational_item_table(feature_name TEXT)
    RETURNS TEXT
    AS
    $$
        DECLARE
            observable_item TEXT := regexp_replace(feature_name, '^observation', 'item');
        BEGIN
            -- Naming convention constraint
            IF feature_name NOT LIKE 'observation\_%' THEN
                RAISE EXCEPTION 'Root Features must follow the naming convention ''observation_...''';
            END IF;

            -- Create the table
            EXECUTE FORMAT('CREATE TABLE %I (
                            item_id SERIAL PRIMARY KEY,
                            is_existing BOOLEAN NOT NULL)', observable_item);

            -- Return the observable item table name
            RETURN observable_item;

        END
    $$ LANGUAGE plpgsql;


-- Column Reference Type construction

CREATE PROCEDURE add_data_col(table_name regclass, column_name TEXT, sql_type_name TEXT, is_nullable BOOLEAN)
    AS
    $$
        BEGIN
            IF is_nullable = TRUE THEN
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, sql_type_name);
            ELSE
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I %s NOT NULL', table_name, column_name, sql_type_name);
            END IF;

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE PROCEDURE add_list(item_table_name TEXT, table_name TEXT, column_name TEXT, sql_type_name TEXT, is_observational BOOLEAN)
    AS
    $$
        DECLARE
            m2m_table_name TEXT := concat('m2m_', table_name);
            observation_table_name regclass := regexp_replace(item_table_name, '^item', 'observation');
        BEGIN
            -- Create list_... table
            EXECUTE FORMAT('CREATE TABLE %I (list_id SERIAL PRIMARY KEY, %I %s NOT NULL)', table_name, column_name, sql_type_name);

            -- If linked to observation_... table else linked to item_... table
            IF is_observational = TRUE THEN
                -- Create m2m_list_... table with foreign key constraints
                EXECUTE FORMAT('CREATE TABLE %I (observation_id INTEGER NOT NULL REFERENCES %I, list_id INTEGER NOT NULL REFERENCES %I)', m2m_table_name, observation_table_name, table_name);
            ELSE
                -- Create m2m_list_... table with foreign key constraints
                EXECUTE FORMAT('CREATE TABLE %I (item_id INTEGER NOT NULL REFERENCES %I, list_id INTEGER NOT NULL REFERENCES %I)', m2m_table_name, item_table_name, table_name);
            END IF;

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE PROCEDURE add_location(item_table_name regclass, location_table_name regclass, is_nullable BOOLEAN)
    AS
    $$
        DECLARE
            location_column_name TEXT := concat(location_table_name, '_id');
        BEGIN
            IF is_nullable = TRUE THEN
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER REFERENCES %I', item_table_name, location_column_name, location_table_name);
            ELSE
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER NOT NULL REFERENCES %I', item_table_name, location_column_name, location_table_name);
            END IF;

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE PROCEDURE add_factor(item_table_name TEXT, table_name TEXT, column_name TEXT, sql_type_name TEXT, is_nullable BOOLEAN, is_observational BOOLEAN)
    AS
    $$
        DECLARE
            factor_column_name TEXT := concat(table_name, '_id');
            observation_table_name regclass := regexp_replace(item_table_name, '^item', 'observation');
        BEGIN
            -- Add factor table
            EXECUTE FORMAT('CREATE TABLE %I (factor_id SERIAL PRIMARY KEY, %I %s NOT NULL)', table_name, column_name, sql_type_name);

            IF is_observational = TRUE THEN
                -- Add referencing column to observation table
                IF is_nullable = TRUE THEN
                    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER REFERENCES %I', observation_table_name, factor_column_name, table_name);
                ELSE
                    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER NOT NULL REFERENCES %I', observation_table_name, factor_column_name, table_name);
                END IF;
            ELSE
                -- Add referencing column to item table
                IF is_nullable = TRUE THEN
                    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER REFERENCES %I', item_table_name, factor_column_name, table_name);
                ELSE
                    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER NOT NULL REFERENCES %I', item_table_name, factor_column_name, table_name);
                END IF;
            END IF;

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE PROCEDURE add_attribute(item_table_name TEXT, table_name TEXT, column_name TEXT, sql_type_name TEXT)
    AS
    $$
        DECLARE
            attribute_column_name TEXT := concat(table_name, '_id');
            observation_table_name regclass := regexp_replace(item_table_name, '^item', 'observation');
        BEGIN
            -- Create attribute table
            EXECUTE FORMAT('CREATE TABLE %I (attribute_id SERIAL PRIMARY KEY, %I %s NOT NULL)', table_name, column_name, sql_type_name);

            -- Add attribute column to observation table
            EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER REFERENCES %I', observation_table_name, attribute_column_name, table_name);

            -- Add attribute column to item table
            EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER REFERENCES %I', item_table_name, attribute_column_name, table_name);

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE PROCEDURE add_unique_constraint(table_name regclass, unique_over TEXT)
    AS
    $$
        DECLARE 
            constraint_name TEXT := concat(table_name, '_id_columns');
        BEGIN
            EXECUTE FORMAT('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (%s)', table_name, constraint_name, unique_over);

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Special column reference type construction

/*
Auditor Name trigger function
    Note that this is the function that the trigger calls, the trigger 
    itself is dynamically generated in construct.js
*/
CREATE FUNCTION check_auditor_name() RETURNS TRIGGER AS $check_auditor_name$
    BEGIN
        -- Both can't be NULL \
        IF (NEW.data_auditor IS NULL AND (SELECT (SELECT COUNT(*) FROM m2m_auditor WHERE observation_count_id = NEW.observation_count_id) = 0) ) THEN
            RAISE EXCEPTION '%.data_auditor and m2m_auditor.user_id cannot both be NULL', TG_TABLE_NAME;
        END IF;
        -- One must be NULL \
        IF (NEW.data_auditor IS NOT NULL AND (SELECT (SELECT COUNT(*) FROM m2m_auditor WHERE observation_count_id = NEW.observation_count_id) != 0) ) THEN
            RAISE EXCEPTION 'Either %.data_auditor or m2m_auditor.user_id must be NULL', TG_TABLE_NAME;
        END IF;
        -- Since no exceptions return the row \
        RETURN NEW;
    END;
    $check_auditor_name$ LANGUAGE plpgsql;

-- Inserting into metadata

-- 1. insert every static item table into metadata_item
INSERT INTO metadata_item
    (item_id, table_name, frontend_name, item_type, creation_privilege)
        VALUES
            --('item_room', (SELECT type_id FROM metadata_item_type WHERE type_name = 'observable'), 4), --construct.js
            (DEFAULT, 'item_building', 'Building', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 4),
            (DEFAULT, 'item_organization', 'Organization', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_entity', 'Entity', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_city', 'City', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_county', 'County', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_state', 'State', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_country', 'Country', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_sop', 'Standard Operating Procedure', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 4),
            (DEFAULT, 'item_template', 'Template', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3),
            (DEFAULT, 'item_user', 'User', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 1),
            (DEFAULT, 'item_submission', 'Submission', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3),
            (DEFAULT, 'item_catalog', 'Catalog', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3),
            (DEFAULT, 'item_audit', 'Audit', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3);


-- Calling insertion procedure
-- potential-observable
CALL "insert_m2m_metadata_item"('item_building', 'item_entity', TRUE, FALSE, 'Entity of Building', NULL);
CALL "insert_m2m_metadata_item"('item_organization', 'item_entity', TRUE, FALSE, 'Entity of Organization', NULL);
CALL "insert_m2m_metadata_item"('item_entity', 'item_city', FALSE, TRUE, 'City of Entity', NULL);
CALL "insert_m2m_metadata_item"('item_city', 'item_county', TRUE, FALSE, 'County of City', NULL);
CALL "insert_m2m_metadata_item"('item_county', 'item_state', TRUE, FALSE, 'State of County', NULL);
CALL "insert_m2m_metadata_item"('item_state', 'item_country', TRUE, FALSE, 'Country of State', NULL);

-- non-observable
CALL "insert_m2m_metadata_item"('item_sop', 'item_organization', TRUE, FALSE, 'Authoring Organization', NULL);
CALL "insert_m2m_metadata_item"('item_template', 'item_user', TRUE, FALSE, 'Authoring User', NULL);
CALL "insert_m2m_metadata_item"('item_template', 'item_organization', TRUE, FALSE, 'Authoring Organization', NULL);
CALL "insert_m2m_metadata_item"('item_user', 'item_organization', TRUE, FALSE, 'Member of Organization', NULL);
--     submission
CALL "insert_m2m_metadata_item"('item_submission', 'item_audit', TRUE, FALSE, 'Audit of Submission', NULL);
CALL "insert_m2m_metadata_item"('item_submission', 'item_organization', TRUE, FALSE, 'Submitting Organization', NULL);
CALL "insert_m2m_metadata_item"('item_submission', 'item_user', TRUE, FALSE, 'Submitting User', NULL);
CALL "insert_m2m_metadata_item"('item_submission', 'item_template', FALSE, TRUE, 'Template Used', NULL);
--     audit
CALL "insert_m2m_metadata_item"('item_audit', 'item_catalog', FALSE, TRUE, 'Catalog of Audit', NULL);
CALL "insert_m2m_metadata_item"('item_audit', 'item_user', TRUE, FALSE, 'Authoring User', NULL);




-- Inserting Columns into metadata
-- Item columns
CALL "insert_metadata_column"('data_time_created', 'item_audit', NULL, NULL, 'item_audit', TRUE, FALSE, 'Time Audit Created', 'calendarRange', NULL, 'date', NULL, NULL, 'TIMESTAMPTZ', 'item-non-id');
CALL "insert_metadata_column"('data_population', 'item_city', NULL, NULL, 'item_city', TRUE, TRUE, 'City Population', 'numericEqual', NULL, 'string', NULL, NULL, 'NUMERIC', 'item-non-id');
CALL "insert_metadata_column"('data_fips_code', 'item_county', NULL, NULL, 'item_county', TRUE, TRUE, 'FIPS County Code', 'numericEqual', NULL, 'string', 'Five digit number which uniquely identify counties and county equivalents', NULL, 'NUMERIC', 'item-non-id');
CALL "insert_metadata_column"('data_time_uploaded', 'item_sop', NULL, NULL, 'item_sop', TRUE, FALSE, 'Time SOP Uploaded', 'calendarRange', NULL, 'date', NULL, NULL, 'TIMESTAMPTZ', 'item-non-id');
CALL "insert_metadata_column"('data_template_json', 'item_template', NULL, NULL, 'item_template', FALSE, FALSE, 'Audit Template JSON', 'searchableDropdown', NULL, 'string', 'JSON representation of an audit input template', NULL, 'JSON', 'item-non-id');
CALL "insert_metadata_column"('data_time_submitted', 'item_submission', NULL, NULL, 'item_submission', TRUE, FALSE, 'Time Audit Submission Submitted', 'calendarRange', NULL, 'date', NULL, NULL, 'TIMESTAMPTZ', 'item-non-id');
CALL "insert_metadata_column"('data_description', 'item_catalog', NULL, NULL, 'item_catalog', FALSE, TRUE, 'Audit Description', NULL, 'text', 'string', 'A description of the audit which will appear in the catalog', NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_building_name', 'item_building', NULL, NULL, 'item_building', TRUE, FALSE, 'Building Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_entity_name', 'item_entity', NULL, NULL, 'item_entity', TRUE, FALSE, 'Entity Name', 'searchableDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_entity_address', 'item_entity', NULL, NULL, 'item_entity', TRUE, FALSE, 'Entity Address', 'searchableDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_city_name', 'item_city', NULL, NULL, 'item_city', TRUE, FALSE, 'City Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_submission_name', 'item_submission', NULL, NULL, 'item_submission', TRUE, TRUE, 'Audit Submission Name', 'searchableChecklistDropdown', 'text', 'string', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_county_name', 'item_county', NULL, NULL, 'item_county', TRUE, FALSE, 'County Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_audit_name', 'item_audit', NULL, NULL, 'item_audit', TRUE, TRUE, 'Audit Name', 'searchableChecklistDropdown', 'text', 'string', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_state_name', 'item_state', NULL, NULL, 'item_state', TRUE, FALSE, 'State Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_country_name', 'item_country', NULL, NULL, 'item_country', TRUE, FALSE, 'Country Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_organization_name_text', 'item_organization', NULL, NULL, 'item_organization', TRUE, FALSE, 'Organization Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');
CALL "insert_metadata_column"('data_organization_name_link', 'item_organization', NULL, NULL, 'item_organization', TRUE, TRUE, 'Organization Website', NULL, NULL, 'hyperlink', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_name', 'item_sop', NULL, NULL, 'item_sop', TRUE, FALSE, 'Standard Operating Procedure Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_template_name', 'item_template', NULL, NULL, 'item_template', TRUE, TRUE, 'Audit Template Name', 'text', 'text', 'string', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_title', 'item_catalog', NULL, NULL, 'item_catalog', TRUE, FALSE, 'Audit Title', 'searchableChecklistDropdown', 'text', 'string', NULL, NULL, 'TEXT', 'item-non-id');
--     user
CALL "insert_metadata_column"('data_is_email_public', 'item_user', NULL, NULL, 'item_user', TRUE, FALSE, 'Email visible to Public', 'bool', 'bool', 'bool', NULL, NULL, 'BOOLEAN', 'item-non-id');
CALL "insert_metadata_column"('data_is_quarterly_updates', 'item_user', NULL, NULL, 'item_user', TRUE, FALSE, 'Receive Quarterly Updates', 'bool', 'bool', 'bool', NULL, NULL, 'BOOLEAN', 'item-non-id');
CALL "insert_metadata_column"('data_full_name', 'item_user', NULL, NULL, 'item_user', TRUE, FALSE, 'User Name', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-non-id');
CALL "insert_metadata_column"('data_email', 'item_user', NULL, NULL, 'item_user', FALSE, FALSE, 'User Email', 'searchableChecklistDropdown', 'searchableDropdown', 'string', NULL, NULL, 'TEXT', 'item-id');


-- Locations
-- Building
CALL "insert_metadata_column"('data_region', 'location_region', NULL, NULL, 'item_building', FALSE, FALSE, 'Building Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-location');
-- City
CALL "insert_metadata_column"('data_region', 'location_region', NULL, NULL, 'item_city', FALSE, FALSE, 'City Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-location');
CALL "insert_metadata_column"('data_point', 'location_point', NULL, NULL, 'item_city', FALSE, FALSE, 'City Geographic Point', NULL, NULL, 'location', NULL, NULL, 'Point', 'item-location');
-- County
CALL "insert_metadata_column"('data_region', 'location_region', NULL, NULL, 'item_county', FALSE, FALSE, 'County Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-location');
-- State
CALL "insert_metadata_column"('data_region', 'location_region', NULL, NULL, 'item_state', FALSE, FALSE, 'State Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-location');
-- Country
CALL "insert_metadata_column"('data_region', 'location_region', NULL, NULL, 'item_country', FALSE, FALSE, 'Country Geographic Region', NULL, NULL, 'location', NULL, NULL, 'Polygon', 'item-location');


-- Column Returnable Lookup
create materialized view lookup_column_returnable as 
    select r.returnable_id, c.column_id from metadata_returnable as r left join metadata_column as c on r.column_id = c.column_id;



-- SET DEFAULTS --

-- Setting server timezone to LA time
SET timezone = 'America/Los_Angeles';

DO $$
BEGIN 
    RAISE INFO '
Script run on %L
All data_... columns and their respective tables:', TO_CHAR(NOW()::DATE, 'dd/mm/yyyy'); 
END $$;

-- Get all data_... columns and their respective tables:
--SELECT c.column_name AS "Column Name", t.table_name AS "Table Name" FROM information_schema.tables AS t INNER JOIN information_schema.columns AS c ON t.table_name = c.table_name WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND c.column_name LIKE 'data\_%';

-- Get all item_... tables
--SELECT t.table_name AS "Table Name" FROM information_schema.tables AS t WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND t.table_name LIKE 'item\_%';

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
 