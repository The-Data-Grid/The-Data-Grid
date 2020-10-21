-- The Data Grid Static Table Metadata Insertion Script --
-- Version 4-3 --

/*
    1. insert every static item table into metadata_item
    2. insert connections into m2m_metadata_item
    3. insert every static data_... column into metadata_column
    **4. insert every submission tied data_... column into metadata_returnable (returnable generation is automated)
*/

-- 1. insert every static item table into metadata_item
INSERT INTO metadata_item
    (item_id, table_name, item_type, creation_privilege)
        VALUES
            --('item_room', (SELECT type_id FROM metadata_item_type WHERE type_name = 'observable'), 4), --construct.js
            (DEFAULT, 'item_building', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 4),
            (DEFAULT, 'item_organization', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_entity', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_city', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_county', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_state', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_country', (SELECT type_id FROM metadata_item_type WHERE type_name = 'potential-observable'), 5),
            (DEFAULT, 'item_sop', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 4),
            (DEFAULT, 'item_template', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3),
            (DEFAULT, 'item_user', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 1),
            (DEFAULT, 'item_submission', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3),
            (DEFAULT, 'item_catalog', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3),
            (DEFAULT, 'item_audit', (SELECT type_id FROM metadata_item_type WHERE type_name = 'non-observable'), 3);


-- 2. insert relations into m2m_metadata_item
-- Insertion Function
CREATE PROCEDURE insert_m2m_metadata_item(observable_item TEXT, 
                                         referenced TEXT, 
                                         isID BOOLEAN,
                                         isNullable BOOLEAN)
    AS 
    $$
        BEGIN
            
            INSERT INTO m2m_metadata_item
                (item_id, 
                referenced_item_id, 
                is_id,
                is_nullable)
                    VALUES (
                        (SELECT item_id FROM metadata_item WHERE table_name = observable_item),
                        (SELECT item_id FROM metadata_item WHERE table_name = referenced),
                        isID,
                        isNullable
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
                            ADD FOREIGN KEY %I
                            REFERENCES %I ("item_id")', observable_item, required_item_column, referenced);
        
            -- Return the id-column
            RETURN required_item_column;
        END
    $$ LANGUAGE plpgsql;


-- Calling insertion procedure
-- potential-observable
CALL "insert_m2m_metadata_item"('item_building', 'item_entity', TRUE, FALSE);
CALL "insert_m2m_metadata_item"('item_organization', 'item_entity', TRUE, FALSE);
CALL "insert_m2m_metadata_item"('item_entity', 'item_city', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_city', 'item_county', TRUE, FALSE);
CALL "insert_m2m_metadata_item"('item_county', 'item_state', TRUE, FALSE);
CALL "insert_m2m_metadata_item"('item_state', 'item_country', TRUE, FALSE);

-- non-observable
CALL "insert_m2m_metadata_item"('item_sop', 'item_organization', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_template', 'item_user', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_template', 'item_organization', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_user', 'item_organization', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_submission', 'item_audit', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_submission', 'item_user', FALSE, FALSE);
CALL "insert_m2m_metadata_item"('item_submission', 'item_template', FALSE, TRUE);
CALL "insert_m2m_metadata_item"('item_audit', 'item_catalog', FALSE, TRUE);
CALL "insert_m2m_metadata_item"('item_audit', 'item_user', FALSE, FALSE);




-- Calling insertion function
CALL "insert_metadata_column"('data_time_created', 'item_audit', NULL, NULL, 'item_audit', TRUE, FALSE, 'Time Audit Created', 'calendarRange', NULL, 'date', NULL, 'TIMESTAMPTZ', 'item-non-id');
CALL "insert_metadata_column"('data_population', 'item_city', NULL, NULL, 'item_city', TRUE, TRUE, 'City Population', 'numericEqual', NULL, 'string', NULL, 'NUMERIC', 'item-non-id');
CALL "insert_metadata_column"('data_fips_code', 'item_county', NULL, NULL, 'item_county', TRUE, TRUE, 'FIPS County Code', 'numericEqual', NULL, 'string', 'Five digit number which uniquely identify counties and county equivalents', 'NUMERIC', 'item-non-id');
CALL "insert_metadata_column"('data_time_uploaded', 'item_sop', NULL, NULL, 'item_sop', TRUE, FALSE, 'Time SOP Uploaded', 'calendarRange', NULL, 'string', NULL, 'TIMESTAMPTZ', 'item-non-id');
CALL "insert_metadata_column"('data_template_json', 'item_template', NULL, NULL, 'item_template', FALSE, FALSE, 'Audit Template', NULL, NULL, 'string', NULL, 'JSON', 'item-non-id');





-- 3. insert every static data_... column into metadata_column
-- Insertion Function
CREATE PROCEDURE insert_metadata_column(column_name TEXT, 
                                       table_name TEXT, 
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
                sql_type,
                reference_type)
                VALUES (
                    DEFAULT,
                    column_name,
                    table_name,
                    observation_table_name,
                    subobservation_table_name,
                    (SELECT item_id FROM metadata_item WHERE table_name = item_table_name),
                    is_default,
                    is_nullable,
                    frontend_name,
                    (SELECT selector_id FROM metadata_selector WHERE selector_name = filter_selector_name),
                    (SELECT selector_id FROM metadata_selector WHERE selector_name = input_selector_name),
                    (SELECT type_id FROM metadata_frontend_type WHERE type_name = frontend_type_name),
                    information,
                    (SELECT type_id FROM metadata_sql_type WHERE type_name = sql_type_name),
                    (SELECT type_id FROM metadata_reference_type WHERE type_name = reference_type_name)
                );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;



-- Insert a feature into metadata_feature
CREATE PROCEDURE insert_metadata_feature(table_name TEXT,
                                        item_table_name TEXT,
                                        information TEXT,
                                        frontend_name TEXT)
    AS
    $$
        BEGIN
            IF table_name NOT LIKE 'observation\_%' THEN
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
                    table_name,
                    (SELECT item_id FROM metadata_item WHERE table_name = item_table_name),
                    information,
                    frontend_name
                );

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Insert a subfeature into metadata_feature
CREATE PROCEDURE insert_metadata_subfeature(table_name TEXT,
                                           parent_table_name TEXT,
                                           num_feature_range INTEGER,
                                           information TEXT,
                                           frontend_name TEXT)
    AS
    $$
        BEGIN
            IF table_name NOT LIKE 'subobservation\_%' THEN
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
                    table_name,
                    (SELECT feature_id FROM metadata_feature WHERE table_name = parent_table_name),
                    num_feature_range,
                    information,
                    frontend_name
                );
            
            COMMIT;
        END
    $$ LANGUAGE plpgsql;


-- Inserts a new observable item into metadata_item
CREATE PROCEDURE insert_metadata_item_observable(item TEXT, creation_privilege INTEGER)
    AS
    $$
        BEGIN
            INSERT INTO metadata_item
                (item_id,
                table_name, 
                item_type, 
                creation_privilege)
                VALUES (
                    DEFAULT, 
                    item,
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
    RETURNS INTEGER
    AS
    $$
        BEGIN
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
            RETURNING returnable_id AS returnableID;

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
                            ADD FOREIGN KEY "observation_count_id"
                            REFERENCES "observation_count" ("observation_count_id")', table_name);
        
            -- Submission reference
            EXECUTE FORMAT('ALTER TABLE %I (
                            ADD FOREIGN KEY "submission_id"
                            REFERENCES "item_submission" ("submission_id")', table_name);
            
            -- Observable Item reference
            EXECUTE FORMAT('ALTER TABLE %I (
                            ADD FOREIGN KEY "observableitem_id"
                            REFERENCES %s ("item_id")', table_name, observable_item);

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
            EXECUTE FORMAT('ALTER TABLE %I (
                            ADD FOREIGN KEY "parent_id"
                            REFERENCES %s ("observation_id")', table_name, parent_table_name);

            -- Observation Count reference
            EXECUTE FORMAT('ALTER TABLE %I 
                            ADD FOREIGN KEY "observation_count_id"
                            REFERENCES "observation_count" ("observation_count_id")', table_name);

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
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I %L', table_name, column_name, sql_type_name);
            ELSE
                EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN %I %L NOT NULL', table_name, column_name, sql_type_name);
            END IF;

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

CREATE PROCEDURE add_list(item_table_name regclass, table_name TEXT, column_name TEXT, sql_type_name TEXT, is_observational BOOLEAN)
    AS
    $$
        DECLARE
            m2m_table_name TEXT := concat('m2m_', table_name);
            observation_table_name regclass := regexp_replace(item_table_name, '^item', 'observation');
        BEGIN
            -- Create list_... table
            EXECUTE FORMAT('CREATE TABLE %I (list_id SERIAL PRIMARY KEY, %I %L NOT NULL)', table_name, column_name, sql_type_name);

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

CREATE PROCEDURE add_factor(item_table_name regclass, table_name TEXT, column_name TEXT, sql_type_name TEXT, is_nullable BOOLEAN, is_observational BOOLEAN)
    AS
    $$
        DECLARE
            factor_column_name TEXT := concat(table_name, '_id');
            observation_table_name regclass := regexp_replace(item_table_name, '^item', 'observation');
        BEGIN
            -- Add factor table
            EXECUTE FORMAT('CREATE TABLE %I (factor_id SERIAL PRIMARY KEY, %I %L NOT NULL)', table_name, column_name, sql_type_name);

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

CREATE PROCEDURE add_attribute(item_table_name regclass, table_name TEXT, column_name TEXT, sql_type_name TEXT)
    AS
    $$
        DECLARE
            attribute_column_name TEXT := concat(table_name, '_id');
            observation_table_name regclass := regexp_replace(item_table_name, '^item', 'observation');
        BEGIN
            -- Create attribute table
            EXECUTE FORMAT('CREATE TABLE %I (attribute_id SERIAL PRIMARY KEY, %I %L NOT NULL)', table_name, column_name, sql_type_name);

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
            EXECUTE FORMAT('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (%L)', table_name, constraint_name, unique_over);

            COMMIT;
        END
    $$ LANGUAGE plpgsql;

-- Special column reference type construction




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
