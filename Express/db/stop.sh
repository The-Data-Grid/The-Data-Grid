#! /bin/bash

echo "Stopping the PostgreSQL server in the PostgreSQL/data database cluster"
eval pg_ctl stop -D PostgreSQL/data