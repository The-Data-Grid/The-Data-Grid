#! /bin/bash

# Generate Objects
## Build on the production database
eval PGPASSWORD=postgres npm run construct -- make-schema open-schemas $1 --postgresdb=v6

# Preprocess
eval node ../preprocess/setup.js

# Fill submissionObject with correct returnables
mv ../../Schemas/open-schemas/$1/submissionObject.json ../insert/
eval node ../insert/fillReturnables.js

# Run the insertion script
eval node ../insert/manual.js
mv ../insert/submissionObject.json ../../Schemas/open-schemas/$1/

