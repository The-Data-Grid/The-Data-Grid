#! /bin/bash

echo "Adding fake data for the Sink Feature"
eval PGPASSWORD=postgres psql -U postgres -d v5 -h localhost -p 5432 -f "../PostgreSQL/fakedata.sql"
echo "Done!"