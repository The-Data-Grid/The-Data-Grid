#! /bin/bash

echo "Init db"
eval PGPASSWORD=postgres psql -U postgres -d postgres -h localhost -p 5432 -f "../PostgreSQL/reset.sql"
echo "Dropped and Created"
eval PGPASSWORD=postgres psql -U postgres -d v6 -h localhost -p 5432 -f "../PostgreSQL/V6.sql"
echo "Run V6"
eval PGPASSWORD=postgres npm run construct -- make-schema ucla-audits water,waste,crime --postgresdb=v6