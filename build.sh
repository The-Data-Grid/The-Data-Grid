#!/bin/bash

echo "Compress the server distribution"
timestamp=$(date +%s)
eval zip -r api-dist/build-${timestamp}.zip Express/ .env -x Express/node_modules/\*