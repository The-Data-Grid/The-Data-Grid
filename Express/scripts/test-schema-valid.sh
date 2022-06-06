#! /bin/bash

# Generate Objects
node ./construct/convert/converter.js \
    --parseType="$3" \
    --featureName="$4" \
    --auditorName="$5" \
    --featureInformation="$6"

# Move objects to schema
mkdir ../Schemas/$1/$2
mv ./construct/convert/outputObjects/columns.jsonc ../Schemas/$1/$2
mv ./construct/convert/outputObjects/features.jsonc ../Schemas/$1/$2
#mv ./construct/convert/seedData/data.json ../Schemas/open-schemas/$1

#echo "Init db"
#eval PGPASSWORD=postgres psql -U postgres -d postgres -h localhost -p 5432 -f "../PostgreSQL/reset-tester.sql"
#echo "Dropped and Created"
#eval PGPASSWORD=postgres psql -U postgres -d schematester -h localhost -p 5432 -f "../PostgreSQL/V6.sql"

# Build the schema in the tester database
## Always attempt to build schema on a non production database first
#eval PGPASSWORD=postgres npm run construct -- make-schema ucla-audits water,waste,crime --postgresdb=schematester
eval PGPASSWORD=postgres npm run construct -- make-schema $1 $2 --postgresdb=schematester

#eval PGPASSWORD=postgres psql -U postgres -d schematester -h localhost -p 5432 -f "../PostgreSQL/fakedata-noattribute.sql"

# Fill submission object
node ./construct/convert/fillReturnables.js --featureName="$4"

# Move the new object to the schema
mv ./construct/convert/outputObjects/submissionObject.json ../Schemas/$1/$2

# Delete intermezzo objects
rm ./construct/convert/outputObjects/submissionObject1.json

# Preprocess
node ./preprocess/setup.js --postgresdb=schematester

# Insert
node ./insert/manual.js --schema="$2" --database="$1" --postgresdb=schematester
