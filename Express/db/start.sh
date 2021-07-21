#! /bin/bash

echo "Starting a PostgreSQL server in the PostgreSQL/data database cluster on port 5432"
eval lsof -ti tcp:5432 | xargs kill -9
eval "pg_ctl start -l PostgreSQL/logs/logfile -o \"-F -p 5432\" -D PostgreSQL/data"