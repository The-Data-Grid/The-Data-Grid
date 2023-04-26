#! /bin/bash

echo "Init db"
eval PGPASSWORD=postgres psql -U postgres -d postgres -h localhost -p 5432 -f "../PostgreSQL/reset.sql"
echo "Dropped and Created"
eval PGPASSWORD=postgres psql -U postgres -d executive -h localhost -p 5432 -f "../PostgreSQL/executive.sql"
# echo "Run V6"
# eval PGPASSWORD=postgres npm run construct -- make-schema ucla-audits water,waste,crime --postgresdb=v6