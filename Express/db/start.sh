#! /bin/bash

echo "Starting a PostgreSQL server in the PostgreSQL/data database cluster on port 5432"
eval "pg_ctl start -l PostgreSQL/logs/logfile -o \"-F -p 5432\" -D PostgreSQL/data"