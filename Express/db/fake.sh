#! /bin/bash

echo "Adding fake data for the Sink Feature"
eval psql -U postgres -d v4 -f "./PostgreSQL/fakedata.sql"
echo "Done!"