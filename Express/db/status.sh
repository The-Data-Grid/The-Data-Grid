#! /bin/bash

echo "Status of the PostgreSQL server in the PostgreSQL/data database cluster: "
eval pg_ctl status -D ../PostgreSQL/data
exit 0