-- The Data Grid Database Creation Script --
-- Version 6 --

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

-- Submission and Globals

CREATE TABLE item_global (
    item_id SERIAL PRIMARY KEY,
    item_audit_id INTEGER NOT NULL, --fk **
    item_organization_id INTEGER NOT NULL, --fk ** org that user is submitting as, id will be given by session
    item_user_id INTEGER NOT NULL, --fk **
    time_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    spreadsheet_id INTEGER
    --item_template_id INTEGER --fk ** ???
);

CREATE TABLE item_organization (
    item_id SERIAL PRIMARY KEY,  
    data_organization_name_text TEXT NOT NULL,
    data_organization_name_link TEXT,
    UNIQUE(data_organization_name_text)
);

-- Observation count supertable, SOP and User which reference it

CREATE TABLE tdg_observation_count (
    observation_count_id SERIAL PRIMARY KEY
);

CREATE TABLE item_sop (
    item_id SERIAL PRIMARY KEY, 
    data_body TEXT NOT NULL,
    data_name TEXT NOT NULL UNIQUE,
    data_time_uploaded TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    item_organization_id INTEGER NOT NULL --fk **
);

CREATE TABLE m2m_item_sop (
    observation_count_id INTEGER NOT NULL, --fk **
    item_sop_id INTEGER NOT NULL --fk **
);

CREATE TABLE m2m_auditor (
    observation_count_id INTEGER NOT NULL, --fk **
    item_user_id INTEGER NOT NULL --fk **
);

CREATE TABLE item_user (
    item_id SERIAL PRIMARY KEY,
    -- item_organization_id INTEGER, --fk **
    data_first_name TEXT NOT NULL,
    data_last_name TEXT NOT NULL,
    -- data_date_of_birth TIMESTAMPTZ NOT NULL,
    data_email TEXT NOT NULL,
    tdg_p_hash TEXT NOT NULL,
    data_is_email_public BOOLEAN NOT NULL,
    data_is_quarterly_updates BOOLEAN NOT NULL,
    -- is_superuser BOOLEAN NOT NULL,
    secret_token TEXT,
    is_pending BOOLEAN NOT NULL DEFAULT TRUE,
    privilege_id INTEGER NOT NULL, --fk **
    -- Constraint: privilege 'superuser' must only be associated with TDG org
    -- Note: TDG must be the first organization added in the database for now! (must have PK = 1)
    -- CHECK((privilege_id = 3 AND item_organization_id = 1) OR (privilege_id != 3))
    api_key TEXT,
    UNIQUE(data_email),
    UNIQUE(api_key)
);

CREATE TABLE item_audit (
    item_id SERIAL PRIMARY KEY,
    --item_catalog_id INTEGER, --fk **
    data_audit_name TEXT NOT NULL,
    item_user_id INTEGER NOT NULL, --fk **
    item_organization_id INTEGER NOT NULL, --fk ** 
    data_time_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(data_time_created, data_audit_name)
);

-- Privilege

CREATE TABLE tdg_privilege (
    privilege_id SERIAL PRIMARY KEY,
    privilege_name TEXT NOT NULL
);

INSERT INTO tdg_privilege 
    (privilege_id, privilege_name)
        VALUES 
            (DEFAULT, 'guest'),
            (DEFAULT, 'user'),
            (DEFAULT, 'superuser');

-- many to many to many
CREATE TABLE tdg_role (
    role_id SERIAL PRIMARY KEY,
    item_organization_id INTEGER NOT NULL, --fk **
    item_user_id INTEGER NOT NULL, --fk **
    role_type_id INTEGER NOT NULL, --fk **
    UNIQUE(item_organization_id, item_user_id)
);

CREATE TABLE tdg_role_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO tdg_role_type 
    (type_id, type_name)
        VALUES
            (DEFAULT, 'auditor'),
            (DEFAULT, 'admin');


CREATE INDEX item_global_index1
ON item_global (item_audit_id);

CREATE INDEX item_global_index2
ON item_global (item_organization_id);

CREATE INDEX item_global_index3
ON item_global (item_user_id);

CREATE INDEX item_audit_index2
ON item_audit (item_user_id);

CREATE INDEX item_audit_index3
ON item_audit (item_organization_id);

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
obs
    - Observational data column within an observation_... table
    ex: feature_toilet > data_gpf
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
        Auditor: is a coalesce between two data columns in different tables
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
        (DEFAULT, 'item-list-mutable'),
        (DEFAULT, 'item-factor'),
        (DEFAULT, 'item-factor-mutable'),
        (DEFAULT, 'obs'),
        (DEFAULT, 'obs-list'),
        (DEFAULT, 'obs-list-mutable'),
        (DEFAULT, 'obs-factor'),
        (DEFAULT, 'obs-factor-mutable'),
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

CREATE TABLE metadata_selector_new (
    selector_id SERIAL PRIMARY KEY,
    selector_name TEXT NOT NULL
);
INSERT INTO metadata_selector_new
    (selector_id, selector_name)
    VALUES
        (DEFAULT, 'text'),
        (DEFAULT, 'decimal'),
        (DEFAULT, 'wholeNumber'),
        (DEFAULT, 'date'),
        (DEFAULT, 'checkbox'),
        (DEFAULT, 'checkboxList'),
        (DEFAULT, 'dropdown'),
        (DEFAULT, 'geoPoint'),
        (DEFAULT, 'geoLine'),
        (DEFAULT, 'geoRegion');

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
    Authorization
    */
    query_privilege INTEGER NOT NULL, --fk
    query_role INTEGER, --fk
    upload_privilege INTEGER NOT NULL, --fk
    upload_role INTEGER, --fk
    UNIQUE(table_name)
);

CREATE VIEW required_item_view
    AS
    SELECT 
        i1.table_name item_table_name, 
        array_remove(array_agg(i2.table_name), null) required_item_table_name, 
        array_remove(array_agg(m2m.is_nullable), null) is_nullable,
        array_remove(array_agg(m2m.is_id), null) is_id
            from metadata_item i1 
            left join m2m_metadata_item m2m on i1.item_id = m2m.item_id 
            left join metadata_item i2 on i2.item_id = m2m.referenced_item_id 
                group by item_table_name;

CREATE VIEW non_observable_item_view
    AS 
    SELECT i.table_name i__table_name
        FROM metadata_item as i
        LEFT JOIN metadata_item_type as t on i.item_type = t.type_id
            WHERE t.type_name IN ('potential-observable', 'non-observable');


/*
All data_... columns. These are either in 
item_..., feature_..., subfeature_..., list_..., or tdg_... tables
*/
CREATE TABLE metadata_column (
    column_id SERIAL PRIMARY KEY,
    
    /*
    Actual column and table name
    Unique unless reference_type is 'special'
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
    lists and local columns are still related to their feature's observable item.
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
    frontend_type INTEGER, --fk **
    information TEXT,
    accuracy TEXT,

    selector_type INTEGER NOT NULL, --fk **
    is_filterable BOOLEAN NOT NULL,

    /*
    For backend
    */
    sql_type INTEGER NOT NULL, --fk **
    reference_type INTEGER NOT NULL --fk **
);

-- Partially Unique Indices because there are column-table repeats for special
DO
$$
    DECLARE
        special_reference_type_id INTEGER := (SELECT type_id FROM metadata_reference_type WHERE type_name = 'special');
    BEGIN
        -- When not special unique on column-table
        EXECUTE FORMAT('CREATE UNIQUE INDEX col_tab_loc ON metadata_column (column_name, table_name) WHERE (
            reference_type NOT IN (%L)
        )', special_reference_type_id);

        -- When special unique on column-table-item
        EXECUTE FORMAT('CREATE UNIQUE INDEX col_tab_no_loc ON metadata_column (column_name, table_name, metadata_item_id) WHERE (
            reference_type IN (%L)
        )', special_reference_type_id);
        
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
    NULL if the returnable is associated with a feature item
    */
    item_id INTEGER, --fk

    /*
    NULL if an item returnable
    */
    feature_id INTEGER, --fk **

    /*
    The root feature for this subfeature, NULL if not subfeature or if an item returnable
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

create view observation_item_table_name_lookup as
    select f.table_name as observation, i.table_name as item
    from metadata_feature as f
    inner join metadata_item as i on f.observable_item_id = i.item_id; 


CREATE TABLE metadata_observation_history_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_observation_history_type
    (type_id, type_name)
    VALUES
        (DEFAULT, 'create'),
        (DEFAULT, 'update'),
        (DEFAULT, 'delete');

CREATE TABLE metadata_item_history_type (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO metadata_item_history_type
    (type_id, type_name)
    VALUES
        (DEFAULT, 'create'),
        (DEFAULT, 'update'),
        (DEFAULT, 'delete'), -- Does not 'delete', just sets is_existing to false
        (DEFAULT, 'permanent-deletion');

create view observation_history_type as
    select type_id, type_name
    from metadata_observation_history_type;

create view item_history_type as
    select type_id, type_name
    from metadata_item_history_type;

CREATE VIEW returnable_view AS (SELECT 
        
        f.table_name as f__table_name, f.num_feature_range as f__num_feature_range, f.information as f__information, 
        f.frontend_name as f__frontend_name, 
        
        rf.table_name as rf__table_name, 
        
        c.column_id as c__column_id, c.frontend_name as c__frontend_name, c.column_name as c__column_name, c.table_name as c__table_name, 
        c.observation_table_name as c__observation_table_name, c.subobservation_table_name as c__subobservation_column_name, 
        c.information as c__information, c.is_nullable as c__is_nullable, c.is_default as c__is_default, c.accuracy as c__accuracy, 
        c.is_filterable as c__is_filterable, sn.selector_name as sn__selector_name,
        
        fs.selector_name as fs__selector_name, 
        ins.selector_name as ins__selector_name, 
        sql.type_name as sql__type_name, 
        rt.type_name as rt__type_name, 
        ft.type_name as ft__type_name, ft.type_description as ft__type_description, 
        
        r.returnable_id as r__returnable_id, r.frontend_name as r__frontend_name, r.is_used as r__is_used, r.join_object as r__join_object, 
        r.is_real_geo as r__is_real_geo, r.join_object -> 'attributeType' as r__attribute_type, r.feature_id as r__feature_id, 
        
        i.table_name as i__table_name, i.frontend_name as i__frontend_name,

        non_obs_i.table_name as non_obs_i__table_name
        
        FROM metadata_returnable as r 
        LEFT JOIN metadata_column AS c ON c.column_id = r.column_id 
        LEFT JOIN metadata_item as non_obs_i on non_obs_i.item_id = r.item_id
        LEFT JOIN metadata_feature AS f ON r.feature_id = f.feature_id 
        LEFT JOIN metadata_feature AS rf ON r.rootfeature_id = rf.feature_id 
        LEFT JOIN metadata_selector AS fs ON c.filter_selector = fs.selector_id 
        LEFT JOIN metadata_selector AS ins ON c.input_selector = ins.selector_id 
        LEFT JOIN metadata_sql_type AS sql ON c.sql_type = sql.type_id 
        LEFT JOIN metadata_reference_type AS rt ON c.reference_type = rt.type_id 
        LEFT JOIN metadata_item AS i ON c.metadata_item_id = i.item_id 
        LEFT JOIN metadata_frontend_type AS ft ON c.frontend_type = ft.type_id
        LEFT JOIN metadata_selector_new as sn ON c.selector_type = sn.selector_id
            ORDER BY r__returnable_id ASC
        );


-- Down here because it references metadata
CREATE TABLE tdg_upload_action (
    action_id SERIAL PRIMARY KEY,
    action_name TEXT NOT NULL
);

CREATE TABLE tdg_spreadsheet_upload (
    upload_id SERIAL PRIMARY KEY,
    -- action_id INTEGER NOT NULL REFERENCES tdg_upload_action,
    file_key TEXT NOT NULL,
    feature_id INTEGER NOT NULL REFERENCES metadata_feature,
    item_id INTEGER REFERENCES metadata_item,
    upload_type TEXT NOT NULL,
    CHECK(upload_type = 'Item' OR upload_type = 'Observation')
);

ALTER TABLE item_global ADD FOREIGN KEY (spreadsheet_id) REFERENCES tdg_spreadsheet_upload;



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
ALTER TABLE metadata_returnable ADD FOREIGN KEY (item_id) REFERENCES metadata_item;
ALTER TABLE metadata_returnable ADD FOREIGN KEY (feature_id) REFERENCES metadata_feature;
ALTER TABLE metadata_returnable ADD FOREIGN KEY (rootfeature_id) REFERENCES metadata_feature;

ALTER TABLE metadata_column ADD FOREIGN KEY (metadata_item_id) REFERENCES metadata_item;
ALTER TABLE metadata_column ADD FOREIGN KEY (filter_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (input_selector) REFERENCES metadata_selector;
ALTER TABLE metadata_column ADD FOREIGN KEY (frontend_type) REFERENCES metadata_frontend_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (sql_type) REFERENCES metadata_sql_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (reference_type) REFERENCES metadata_reference_type;
ALTER TABLE metadata_column ADD FOREIGN KEY (selector_type) REFERENCES metadata_selector_new;

ALTER TABLE m2m_metadata_item ADD FOREIGN KEY (item_id) REFERENCES metadata_item;
ALTER TABLE m2m_metadata_item ADD FOREIGN KEY (referenced_item_id) REFERENCES metadata_item;

ALTER TABLE metadata_item ADD FOREIGN KEY (item_type) REFERENCES metadata_item_type;
ALTER TABLE metadata_item ADD FOREIGN KEY (query_privilege) REFERENCES tdg_privilege;
ALTER TABLE metadata_item ADD FOREIGN KEY (upload_privilege) REFERENCES tdg_privilege;
ALTER TABLE metadata_item ADD FOREIGN KEY (query_role) REFERENCES tdg_role_type;
ALTER TABLE metadata_item ADD FOREIGN KEY (upload_role) REFERENCES tdg_role_type;


-- Global
ALTER TABLE item_global ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE item_global ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE item_global ADD FOREIGN KEY (item_audit_id) REFERENCES item_audit (item_id);

-- SOP
ALTER TABLE m2m_item_sop ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count ON DELETE CASCADE;
ALTER TABLE m2m_item_sop ADD FOREIGN KEY (item_sop_id) REFERENCES item_sop;
ALTER TABLE item_sop ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;

-- Auditor
ALTER TABLE m2m_auditor ADD FOREIGN KEY (item_user_id) REFERENCES item_user; -- not going to do this because no deleting users
ALTER TABLE m2m_auditor ADD FOREIGN KEY (observation_count_id) REFERENCES tdg_observation_count ON DELETE CASCADE;

-- Audit
ALTER TABLE item_audit ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE item_audit add FOREIGN KEY (item_organization_id) REFERENCES item_organization;

-- Users, Privilege, Organization
ALTER TABLE item_user ADD FOREIGN KEY (privilege_id) REFERENCES tdg_privilege;
ALTER TABLE tdg_role ADD FOREIGN KEY (item_organization_id) REFERENCES item_organization;
ALTER TABLE tdg_role ADD FOREIGN KEY (item_user_id) REFERENCES item_user;
ALTER TABLE tdg_role ADD FOREIGN KEY (role_type_id) REFERENCES tdg_role_type;

                                                                                
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
            EXECUTE FORMAT('CREATE INDEX 
                            ON %I (%I)', observable_item, required_item_column);
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
                                       reference_type_name TEXT,
                                       selector_type TEXT,
                                       is_filterable BOOLEAN)
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
                reference_type,
                selector_type,
                is_filterable)
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
                    (SELECT type_id FROM metadata_reference_type WHERE type_name = reference_type_name),
                    (SELECT selector_id FROM metadata_selector_new WHERE selector_name = selector_type),
                    is_filterable
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
CREATE PROCEDURE insert_metadata_item_observable(item TEXT, frontend_name TEXT, query_role TEXT, query_privilege TEXT, upload_role TEXT, upload_privilege TEXT)
    AS
    $$
        DECLARE
            query_role_id INTEGER := (SELECT type_id FROM tdg_role_type WHERE type_name = query_role);
            query_privilege_id INTEGER := (SELECT privilege_id FROM tdg_privilege WHERE privilege_name = query_privilege);
            upload_role_id INTEGER := (SELECT type_id FROM tdg_role_type WHERE type_name = upload_role);
            upload_privilege_id INTEGER := (SELECT privilege_id FROM tdg_privilege WHERE privilege_name = upload_privilege);
        BEGIN
            INSERT INTO metadata_item
                (item_id,
                table_name,
                frontend_name,
                item_type, 
                query_role,
                query_privilege,
                upload_role,
                upload_privilege
                )
                VALUES (
                    DEFAULT, 
                    item,
                    frontend_name,
                    (SELECT type_id FROM metadata_item_type WHERE type_name = 'observable'),
                    query_role_id,
                    query_privilege_id,
                    upload_role_id,
                    upload_privilege_id
                );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Inserts a new returnable into metadata_returnable without join_object or frontend_name
CREATE FUNCTION insert_metadata_returnable(column_id INTEGER, 
                                          item_id INTEGER,
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
                item_id,
                feature_id,
                rootfeature_id,
                frontend_name,
                is_used,
                join_object,
                is_real_geo)
                VALUES (
                    DEFAULT,
                    column_id,
                    item_id,
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
            history_table_name TEXT := concat('history_', table_name);
        BEGIN
            -- Create the table
            EXECUTE FORMAT('CREATE TABLE %I (
                            observation_id SERIAL PRIMARY KEY,
                            observation_count_id INTEGER NOT NULL,
                            global_id INTEGER NOT NULL,
                            observableitem_id INTEGER NOT NULL)', table_name);
            
            -- Observation Count reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("observation_count_id")
                            REFERENCES "tdg_observation_count" ("observation_count_id")', table_name);

            -- Observation Count Trigger
            
            EXECUTE FORMAT('CREATE TRIGGER trig_copy
                            BEFORE INSERT ON %I
                            FOR EACH ROW
                            EXECUTE PROCEDURE update_observation_count()', table_name);
            
            -- Global reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("global_id")
                            REFERENCES "item_global" ("item_id")', table_name);
            
            -- Observable Item reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("observableitem_id")
                            REFERENCES %I ("item_id")', table_name, observable_item);

            -- observation to item index
            EXECUTE FORMAT ('CREATE INDEX
                             ON %I ("observableitem_id")', table_name);

            -- observation to global index
            EXECUTE FORMAT ('CREATE INDEX
                             ON %I ("global_id")', table_name); 

            -- history table
            -- not using add_history_table because already inside transaction
            EXECUTE FORMAT ('CREATE TABLE %I (
                                history_id SERIAL PRIMARY KEY,
                                type_id INTEGER NOT NULL REFERENCES metadata_observation_history_type,
                                observation_id INTEGER NOT NULL REFERENCES %I,
                                time_submitted TIMESTAMPTZ NOT NULL)', history_table_name, table_name);
            
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
            history_table_name TEXT := concat('history_', observable_item);
        BEGIN
            -- Naming convention constraint
            IF feature_name NOT LIKE 'observation\_%' THEN
                RAISE EXCEPTION 'Root Features must follow the naming convention ''observation_...''';
            END IF;

            -- Create the table
            EXECUTE FORMAT('CREATE TABLE %I (
                            item_id SERIAL PRIMARY KEY,
                            is_existing BOOLEAN NOT NULL DEFAULT TRUE,
                            global_id INTEGER NOT NULL)', observable_item);

            -- Global reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY ("global_id")
                            REFERENCES "item_global" ("item_id")', observable_item);

            -- observation to global index
            EXECUTE FORMAT ('CREATE INDEX
                             ON %I ("global_id")', observable_item); 

            -- history table
            -- not using add_history_table because already inside transaction
            EXECUTE FORMAT ('CREATE TABLE %I (
                                history_id SERIAL PRIMARY KEY,
                                type_id INTEGER NOT NULL REFERENCES metadata_item_history_type,
                                item_id INTEGER NOT NULL REFERENCES %I,
                                time_submitted TIMESTAMPTZ NOT NULL)', history_table_name, observable_item);

            -- Return the observable item table name
            RETURN observable_item;

        END
    $$ LANGUAGE plpgsql;

-- Generic History Table Constuctor
CREATE PROCEDURE add_history_table(table_name TEXT, is_item BOOLEAN)
    AS
    $$
        DECLARE
            history_table_name TEXT := concat('history_', table_name);
        BEGIN
            IF is_item = TRUE THEN
                EXECUTE FORMAT ('CREATE TABLE %I (
                                    history_id SERIAL PRIMARY KEY,
                                    type_id INTEGER NOT NULL REFERENCES metadata_item_history_type,
                                    item_id INTEGER NOT NULL REFERENCES %I,
                                    time_submitted TIMESTAMPTZ NOT NULL)', history_table_name, table_name);
            ELSE
                EXECUTE FORMAT ('CREATE TABLE %I (
                                    history_id SERIAL PRIMARY KEY,
                                    type_id INTEGER NOT NULL REFERENCES metadata_item_history_type,
                                    item_id INTEGER NOT NULL REFERENCES %I,
                                    time_submitted TIMESTAMPTZ NOT NULL)', history_table_name, table_name);
            END IF;

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Column Reference Type construction
CREATE PROCEDURE add_data_col(table_name regclass, column_name TEXT, sql_type_name TEXT, is_nullable BOOLEAN, is_location BOOLEAN)
    AS
    $$
        BEGIN
            IF is_nullable = TRUE THEN
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, sql_type_name);
            ELSE
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I %s NOT NULL', table_name, column_name, sql_type_name);
            END IF;

            IF is_location = TRUE THEN
                EXECUTE FORMAT('CREATE INDEX ON %I USING GIST (%I)', table_name, column_name);
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
                EXECUTE FORMAT('CREATE TABLE %I (observation_id INTEGER NOT NULL REFERENCES %I ON DELETE CASCADE, list_id INTEGER NOT NULL REFERENCES %I)', m2m_table_name, observation_table_name, table_name);
                -- list_id Index
                EXECUTE FORMAT ('CREATE INDEX ON %I ("list_id")', m2m_table_name);
                -- observation_id Index
                EXECUTE FORMAT ('CREATE INDEX ON %I ("observation_id")', m2m_table_name);
            ELSE
                -- Create m2m_list_... table with foreign key constraints
                EXECUTE FORMAT('CREATE TABLE %I (item_id INTEGER NOT NULL REFERENCES %I ON DELETE CASCADE, list_id INTEGER NOT NULL REFERENCES %I)', m2m_table_name, item_table_name, table_name);
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

                -- Add index on factor fk
                EXECUTE FORMAT('CREATE INDEX 
                                ON %I (%I)', observation_table_name, factor_column_name);
            ELSE
                -- Add referencing column to item table
                IF is_nullable = TRUE THEN
                    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER REFERENCES %I', item_table_name, factor_column_name, table_name);
                ELSE
                    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I INTEGER NOT NULL REFERENCES %I', item_table_name, factor_column_name, table_name);
                END IF;

                -- Add index on factor fk
                EXECUTE FORMAT('CREATE INDEX 
                                ON %I (%I)', item_table_name, factor_column_name);
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
Auditor trigger function
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


-- tdg_observation_count updation trigger


CREATE FUNCTION update_observation_count() RETURNS TRIGGER AS
$$
    BEGIN
        INSERT INTO tdg_observation_count
            (observation_count_id) 
                VALUES
                    (currval('tdg_observation_count_observation_count_id_seq') - 1); -- this is weird
        RETURN NEW;
    END;
$$
LANGUAGE plpgsql;

-- this is weird x2
-- only way to get the supertable working with a serial sequence
select nextval('tdg_observation_count_observation_count_id_seq');


-- Inserting into metadata

-- 1. insert every static item table into metadata_item
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
            (DEFAULT, 'item_organization', 'Organization', 3, 1, null, 3, null),
            (DEFAULT, 'item_sop', 'Standard Operating Procedure', 3, 1, null, 2, 1),
            (DEFAULT, 'item_user', 'User', 3, 1, null, 3, null), -- Note upload privilege superuser users are created through the user API
            (DEFAULT, 'item_global', 'Global Item', 3, 1, null, 2, 1),
            (DEFAULT, 'item_audit', 'Audit', 3, 1, null, 2, 1);

-- Column Returnable Lookup
create materialized view lookup_column_returnable as 
    select r.returnable_id, c.column_id from metadata_returnable as r left join metadata_column as c on r.column_id = c.column_id;


create view metadata_item_columns as
    select 
        array_agg(c.column_id) c__column_id, 
        array_agg(c.column_name) c__column_name, 
        array_agg(c.table_name) c__table_name, 
        array_agg(sn.selector_name) sn__selector_name,
        array_agg(c.is_nullable) c__is_nullable,
        array_agg(r.type_name) r__type_name,
        array_agg(c.frontend_name) c__frontend_name,
        i.table_name i__table_name 
            from metadata_item i 
            left join metadata_column c on c.metadata_item_id = i.item_id
            left join metadata_selector_new sn on c.selector_type = sn.selector_id
            left join metadata_reference_type r on c.reference_type = r.type_id
            -- where c.observation_table_name is null
                group by i__table_name;

create view metadata_observation_columns as
    select 
        array_agg(c.column_id) c__column_id, 
        array_agg(c.column_name) c__column_name, 
        array_agg(c.table_name) c__table_name, 
        array_agg(c.is_nullable) c__is_nullable,
        array_agg(r.type_name) r__type_name,
        i.table_name i__table_name 
            from metadata_column c 
            left join metadata_item i on c.metadata_item_id = i.item_id
            left join metadata_reference_type r on c.reference_type = r.type_id
            where c.observation_table_name is not null
                group by i__table_name;

-- SET DEFAULTS --

-- Setting server timezone to LA time
SET timezone = 'America/Los_Angeles';

DO $$
    BEGIN 
        RAISE INFO '
        Script run on %L
        All data_... columns and their respective tables:', TO_CHAR(NOW()::DATE, 'dd/mm/yyyy'); 
    END 
$$;

/* For Debugging */
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
 