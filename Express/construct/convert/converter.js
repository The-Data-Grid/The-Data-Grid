const fs = require('fs');
const csv = require('csv-parser');
let parseType;

// Static objects
const ROWS_PER_OBSERVATION = 50000

// Collect command line arguments
const cli = {}
process.argv.slice(2).forEach(arg => {
    let parsed = arg.split('=');
    cli[parsed[0].slice(2)] = parsed[1];
})
console.log('CLI args: ' + process.argv.slice(2).join(', '));
// featureInformation is optional
if(!['featureName', 'auditorName', 'parseType', 'tempFolderName'].every(arg => arg in csv)) {
    throw Error('Not enough CLI arguments passed');
}
// set parse type
if(!['csv', 'geojson'].includes(cli.parseType)) {
    throw Error(`parseType must be either csv or geojson (${cli.parseType} passed)`);
} else {
    parseType = cli.parseType;
}

// Parse starter objects to fill
let submissionObjectTemplate = JSON.parse(fs.readFileSync(__dirname + '/templateObjects/submissionObject.json', 'utf-8'));
let featuresTemplate = JSON.parse(fs.readFileSync(__dirname + '/templateObjects/features.json', 'utf-8'));

// Generate all of the objects
generateObjects();

async function generateObjects() {
    // 1. Parse CSV or JSON
    console.log('Arguments passed successfully');
    let {
        parsed,
        geospatialKey,
        geospatialType,
     } = await parseData();
    console.log('Data parsed successfully');

    // 2. Generate the schema
    const returned = generateSchema(parsed, featuresTemplate, geospatialKey, geospatialType);
    const {
        colNames,
        features,
        columns,
        latName,
        longName,
    } = returned;
    geospatialKey = returned.geospatialKey;
    geospatialType = returned.geospatialType;

    console.log('Schema generated successfully');
    // Write to file
    fs.writeFileSync(cli.tempFolderName + '/features.jsonc', JSON.stringify(features));
    fs.writeFileSync(cli.tempFolderName + '/columns.jsonc', JSON.stringify(columns));

    // 3. Generate the submissionObject(s)
    writeSubmissionObject(parsed, colNames, columns, 1, submissionObjectTemplate, {
        geospatialKey,
        geospatialType,
        latName,
        longName
    });
    console.log('Data insertion object generated successfully');
}

/*
 *  IMPORT AND PARSE
 *  ==========================================================
*/
async function parseData() {

    let parsed;
    let geospatialKey = null;
    let geospatialType = null;
    if(parseType == 'csv') {
        parsed = await parseCSV();
    } else {
        parsed = parseJSON();
    }
    return {
        parsed,
        geospatialKey,
        geospatialType,
    };

    function parseJSON() {
        let parsed = JSON.parse(fs.readFileSync(cli.tempFolderName + '/geojson.json', 'utf-8'));
        
        // Convert to CSV format
        if(parsed.type !== 'FeatureCollection') {
            throw Error('Only FeatureCollection geojson type accepted');
        }
        // Add each feature
        let csvFormat = parsed.features.map(feature => {
            feature.properties[cli.featureName + ' Location'] = feature.geometry;
            return feature.properties;
        });
        geospatialKey = cli.featureName + ' Location';
        geospatialType = csvFormat[0][geospatialKey].type;
        if(!['Point', 'LineString', 'Polygon'].includes(geospatialType)) {
            throw Error(`Only Point, LineString, and Polygon GeoJSON types allowed`);
        }
        return csvFormat;
    }

    function parseCSV() {
        return new Promise((resolve, reject) => {
            let parsed = [];
            fs.createReadStream(cli.tempFolderName + '/csv.csv', 'utf-8')
                .pipe(csv())
                .on('data', data => parsed.push(data))
                .on('end', () => {
                    resolve(parsed);
                });
        });
    }
}

/*
 *  SCHEMA GENERATION
 *  ==========================================================
*/
function generateSchema(parsed, featuresTemplate, geospatialKey, geospatialType) {
    // pass arg info
    let features = featuresTemplate;
    features[0].information = cli.featureInformation ?? null;
    features[0].name = cli.featureName;

    let longName = null;
    let latName = null;
    
    let colNames = Object.keys(parsed[0])
    let columns = [];
    // Add item ID column
    columns.push({ 
        "featureName": cli.featureName,
        "name": "Item ID",
        "information": "Observational data, so only one item exists", // optional, defaults to null
        "accuracy": null,
        "sqlType": "INTEGER", // required
        "referenceType": "item-id", // required
        "presetValues": null,
        "isNullable": false // required
    });

    // Geospatial handling
    if(geospatialKey !== null) {
        console.log('Geospatial columns present')

        // add to schema and remove from columns to generate from
        columns.push({ 
            "featureName": cli.featureName,
            "name": geospatialKey,
            "information": null, // optional, defaults to null
            "accuracy": null,
            "sqlType": geospatialType, // required
            "referenceType": "obs", // required
            "presetValues": null,
            "isNullable": true // required
        });
        const geospatialKeyIndex = colNames.map(name => name == geospatialKey).indexOf(true);
        colNames.splice(geospatialKeyIndex, 1);
    } else {
        // Try and find it in the rows
        if(
            colNames.some(name => /(?:.*[\s _\-])?[Ll][Oo]?[Nn][Gg]?(?:[\s _\-].*)?/.test(name) || /.*longitude.*/i.test(name)) &&
            colNames.some(name => /(?:.*[\s _\-])?[Ll][Aa][Tt](?:[\s _\-].*)?/.test(name) || /.*latitude.*/i.test(name))
        ) {
            console.log('Geospatial columns present')
            let longIndex = colNames.map(name => /(?:.*[\s _\-])?[Ll][Oo]?[Nn][Gg]?(?:[\s _\-].*)?/.test(name) || /.*longitude.*/i.test(name)).indexOf(true);
            let latIndex = colNames.map(name => /(?:.*[\s _\-])?[Ll][Aa][Tt](?:[\s _\-].*)?/.test(name) || /.*latitude.*/i.test(name)).indexOf(true);
        
            geospatialKey = cli.featureName + ' Location';
            geospatialType = 'Point';

            columns.push({ 
                "featureName": cli.featureName,
                "name": geospatialKey,
                "information": null, // optional, defaults to null
                "accuracy": null,
                "sqlType": geospatialType, // required
                "referenceType": "obs", // required
                "presetValues": null,
                "isNullable": true // required
            });

            longName = colNames[longIndex];
            latName = colNames[latIndex];
        
            colNames.splice(longIndex, 1);
            colNames.splice(latIndex, 1);
        } else {
            console.log('No geospatial columns present');
        }
    }
    columns = [...columns, ...colNames.map(key => generateSchemaColumns(key))];
    
    function generateSchemaColumns(key) {
    
        let referenceType;
        let sqlType;
        let presetValues = null;
        let name = formatName(key);
        let information = null;
        let isNullable = true;
        let accuracy = null;
        let featureName = cli.featureName;
        
        console.log('Generating columnObject for: ' + name);
    
        const lookup = {};
        let intError = false;
        let floatError = false;
        for(let i = 0; i < parsed.length; i++) {
            let value = parsed[i][key];
            // Convert nullish values to null
            if(value.length == 0 || value == 'null' || value == null || value == ' ') {
                parsed[i][key] = null;
                continue;
            };
            if(value in lookup) {
                lookup[value]++
            } else {
                lookup[value] = 1;
            }
    
            if(!intError) {
                try {
                    parseInt(val);
                } catch(err) {
                    intError = true;
                    try {
                        parseFloat(val);
                    } catch(err) {
                        floatError = true;
                    }
                }
            } else if(!floatError) {
                try {
                    parseFloat(val);
                } catch(err) {
                    floatError = true;
                }
            }
        }

        // If less than 200 unique values, use a factor
        if(Object.values(lookup).length < 200) {
            presetValues = Object.keys(lookup);
            referenceType = 'obs-factor';
        } else {
            referenceType = 'obs';
        }
        if(!intError) {
            sqlType = 'INTEGER';
        } else if(!floatError) {
            sqlType = 'NUMERIC';
        } else {
            sqlType = 'TEXT';
        }
    
        return {
            featureName,
            name,
            information,
            accuracy,
            sqlType,
            referenceType,
            presetValues,
            isNullable
        };
    }

    return {
        colNames,
        features,
        columns,
        latName,
        longName,
        geospatialKey,
        geospatialType
    };
}

/*
 *  SUBMISSION GENERATION
 *  ==========================================================
*/
function writeSubmissionObject(parsed, colNames, columns, wroteObjectIndex, obj, geoObject) {
    // unpack geo
    const {
        geospatialKey,
        geospatialType,
        latName,
        longName
    } = geoObject;
    // submissionObject
    obj.observations.create.push({
        "itemTypeID": "TO_BE_FILLED",
        "itemPrimaryKey": null,
        "newItemIndex": 0,
        "globalPrimaryKey": 1,
        "newGlobalIndex": null,
        "data": {multiple: true, returnableIDs: null, data: []}});
    // add returnables as names
    let returnables = [
        'Auditor',
        'Standard Operating Procedure'
    ];
    if(geospatialKey) {
        returnables.push(geospatialKey);
    }
    returnables = [...returnables, ...colNames.map(name => formatName(name))];
    obj.observations.create[obj.observations.create.length - 1].data.returnableIDs = returnables;

    console.log('Computing submissionObject #' + wroteObjectIndex);
    // 50k at a time
    let startIndex = (wroteObjectIndex - 1) * ROWS_PER_OBSERVATION;
    let stopIndex = Math.min(wroteObjectIndex * ROWS_PER_OBSERVATION, parsed.length);
    for(let i = startIndex; i < stopIndex; i++) {
        // prepend Auditor and Standard Operating Procedure data
        let prepend = [cli.auditorName, []];

        // if geospatial column then add it
        if(latName) {
            // don't add geojson if either lat or long cannot be converted to a float
            try {
                prepend.push({
                    type: geospatialType,
                    coordinates: [parseFloat(parsed[i][latName]), parseFloat(parsed[i][longName])]
                });
            } catch(err) {
                prepend.push(null);
            }
        }
        // if geojson
        else if(geospatialKey) {
            prepend.push(parsed[i][geospatialKey]);
        }
        
        // add the data array
        let combined = [
            ...prepend,
            ...colNames.map(key => ({key, val: parsed[i][key]})).map(obj => {
                const {
                    key,
                    val
                } = obj;
                // first, if nullish set to null
                if(val == '' || val == ' ' || val == 'null' || val == null) {
                    return null;
                }
                // parse based on sql type
                let sqlType = columns.filter(obj => obj.name == formatName(key))[0].sqlType;
                if(sqlType == 'TEXT') return String(val);
                try {
                    if(sqlType == 'INTEGER') return parseInt(val);
                    if(sqlType == 'NUMERIC') return parseFloat(val);
                } catch(err) {
                    return null;
                }
            })
        ];
        obj.observations.create[obj.observations.create.length - 1].data.data.push(combined);
    }
    
    // write file or recurse
    if(stopIndex == parsed.length) {
        console.log('Writing submissionObject #' + wroteObjectIndex);
        fs.mkdirSync(`${cli.tempFolderName}/submissionsWithoutReturnables`);
        fs.writeFileSync(`${cli.tempFolderName}/submissionsWithoutReturnables/submissionObject_${wroteObjectIndex}.json`, JSON.stringify(obj));
        console.log('Wrote submissionObject #' + wroteObjectIndex);
    } else {
        writeSubmissionObject(parsed, colNames, columns, wroteObjectIndex + 1, obj, geoObject);
    }
}

function formatName(name) {
    name = name.split(/[_\- ]/);
    name = name.map(substring => {
        if(substring.length == 0) return null;
        return substring[0].toUpperCase() + substring.slice(1).toLowerCase()
    });
    name = name.filter(char => char !== null).join(' ');
    return name;
}
