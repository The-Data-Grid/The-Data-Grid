#! /bin/bash

echo "Adding fake data for the Sink Feature"
eval psql -U postgres -d v4 -f "./PostgreSQL/V4-3-fakedata.sql"
echo "Done!"