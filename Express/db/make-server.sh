#! /bin/bash

echo "Making database cluster"
eval pg_ctl init -D "../PostgreSQL/data"
eval bash "./db/start.sh"
eval psql -d postgres -f "../PostgreSQL/role.sql"
