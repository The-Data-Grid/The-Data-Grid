#! /bin/bash

echo "Init db"
eval psql -U postgres -d postgres -f "./PostgreSQL/V4-3-reset.sql"
echo "Dropped and Created"
eval psql -U postgres -d v4 -f "./PostgreSQL/V4-3.sql"
echo "Run V4-3"
eval npm run construct -- make-schema water
echo "Constructed Schema"