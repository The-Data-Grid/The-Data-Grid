
CREATE TABLE item_database_executive (
    item_id SERIAL PRIMARY KEY,  
    data_database_name TEXT NOT NULL,
    data_database_sql_name TEXT NOT NULL,
    data_is_temp BOOLEAN NOT NULL,
    data_time_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(data_database_name),
    UNIQUE(data_database_sql_name)
);

CREATE TABLE db_api_key (
    key_id SERIAL PRIMARY KEY,
    data_key TEXT NOT NULL,
    UNIQUE(data_key)
);
