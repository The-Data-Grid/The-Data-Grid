#! /bin/bash

# Generate Objects
node ../construct/converter.js open-schemas/$1

# Move objects to schema
mkdir ../../Schemas/open-schemas/$1
mv ../construct/columns.jsonc ../../Schemas/open-schemas/$1
mv ../construct/features.jsonc ../../Schemas/open-schemas/$1
mv ../construct/submissionObject.jsonc ../../Schemas/open-schemas/$1
mv ../construct/data.csv ../../Schemas/open-schemas/$1

# Build the schema in the tester database
## Note the --attempt flag. It is used to build the schema in a tester database
## Always attempt to build schema on a non production database first
eval PGPASSWORD=postgres npm run construct -- make-schema open-schemas $1 --postgresdb=schema-tester
