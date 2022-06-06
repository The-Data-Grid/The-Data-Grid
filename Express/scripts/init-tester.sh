#! /bin/bash

echo "Init db"
eval PGPASSWORD=postgres psql -U postgres -d postgres -h localhost -p 5432 -f "../PostgreSQL/reset-tester.sql"
echo "Dropped and Created"
eval PGPASSWORD=postgres psql -U postgres -d schematester -h localhost -p 5432 -f "../PostgreSQL/V6.sql"