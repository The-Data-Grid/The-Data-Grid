
CREATE TABLE item_database_executive (
    item_id SERIAL PRIMARY KEY,  
    data_database_name TEXT NOT NULL,
    data_database_sql_name TEXT NOT NULL,
    data_claim_code TEXT NOT NULL, -- auto generated so user can claim the database
    data_time_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(data_database_name),
    UNIQUE(data_database_sql_name)
);

-- Privilege
CREATE TABLE tdg_privilege_executive (
    privilege_id SERIAL PRIMARY KEY,
    privilege_name TEXT NOT NULL
);

INSERT INTO tdg_privilege_executive 
    (privilege_id, privilege_name)
        VALUES 
            (DEFAULT, 'guest'),
            (DEFAULT, 'user'),
            (DEFAULT, 'superuser');

CREATE TABLE tdg_role_type_executive (
    type_id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO tdg_role_type_executive 
    (type_id, type_name)
        VALUES
            (DEFAULT, 'auditor'),
            (DEFAULT, 'admin');

CREATE TABLE item_user_executive (
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
    privilege_id INTEGER NOT NULL REFERENCES tdg_privilege_executive, --fk **
    -- Constraint: privilege 'superuser' must only be associated with TDG org
    -- Note: TDG must be the first organization added in the database for now! (must have PK = 1)
    -- CHECK((privilege_id = 3 AND item_organization_id = 1) OR (privilege_id != 3))
    api_key TEXT,
    UNIQUE(data_email),
    UNIQUE(api_key)
);

-- many to many to many
CREATE TABLE tdg_role_executive (
    role_id SERIAL PRIMARY KEY,
    item_database_id INTEGER NOT NULL REFERENCES item_database_executive, --fk **
    item_user_id INTEGER NOT NULL REFERENCES item_user_executive, --fk **
    role_type_id INTEGER NOT NULL REFERENCES tdg_role_type_executive, --fk **
    UNIQUE(item_database_id, item_user_id)
);


