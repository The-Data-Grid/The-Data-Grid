#! /bin/bash

# Note that you must manually set the database to the production credentials. The CLI
# will also ask for a password when you run this

# Fake data
eval psql -U postgres -d <ENTER DATABASE> -h <ENTER HOST> -p 5432 -f "../PostgreSQL/fakedata-noattribute.sql"