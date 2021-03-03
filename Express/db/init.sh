#! /bin/bash

echo "Init db"
eval psql -U postgres -d postgres -f "./PostgreSQL/reset.sql"
echo "Dropped and Created"
eval psql -U postgres -d v5 -f "./PostgreSQL/V5.0.sql"
echo "Run V5.0"
eval npm run construct -- make-schema water
echo "Constructed Schema"