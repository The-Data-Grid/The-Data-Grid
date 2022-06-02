#! /bin/bash

# Note that you must manually set the database to the production credentials. The CLI
# will also ask for a password when you run this

eval psql -U postgres -d <ENTER DATABASE> -h <ENTER HOST> -p 5432 -f "../PostgreSQL/V6.sql"
eval npm run construct -- make-schema <ENTER DATABASE> <ENTER SCHEMA(S)> --postgresdb=<ENTER POSTGRES DB>