const fs = require('fs');
const Papa = require('papaparse');

let file = fs.readFileSync(__dirname + '/data.csv', 'utf-8');
let parsed = Papa.parse(file, {header: true});

const features = [
    {
        "authorization": {
            "queryPrivilege": "guest",
            "queryRole": null,
            "uploadPrivilege": "user",
            "uploadRole": "auditor"
        },
        "information": "This dataset reflects incidents of crime in the City of Los Angeles dating back to 2020. This data is transcribed from original crime reports that are typed on paper and therefore there may be some inaccuracies within the data. Some location fields with missing data are noted as (0°, 0°). Address fields are only provided to the nearest hundred block in order to maintain privacy. This data is as accurate as the data in the database. Please note questions or concerns in the comments.",
        "name": "Crime Incident",
        "observableItem": {
            "requiredItem": [
            ]
        }
    }
]

let colNames = Object.keys(parsed.data[0])
let columns = [];
columns.push({ 
    "featureName": "Crime Incident",
    "name": "Item ID",
    "information": "Observational data, so only one item exists", // optional, defaults to null
    "accuracy": null,
    "sqlType": "INTEGER", // required
    "referenceType": "item-id", // required
    "presetValues": null,
    "isNullable": false // required
});

if(
    colNames.some(name => /.*[\s _\-]?lo?ng[\s _\-]?.*/.test(name) || /.*longitude.*/.test(name)) &&
    colNames.some(name => /.*[\s _\-]?lat[\s _\-]?.*/.test(name) || /.*latitude.*/.test(name))
) {
    let longIndex = colNames.map(name => /.*[\s _\-]?lo?ng[\s _\-]?.*/.test(name) || /.*longitude.*/.test(name)).indexOf(true);
    let latIndex = colNames.map(name => /.*[\s _\-]?lat[\s _\-]?.*/.test(name) || /.*latitude.*/.test(name)).indexOf(true);

    columns.push({ 
        "featureName": "Crime Incident",
        "name": "Crime Location",
        "information": null, // optional, defaults to null
        "accuracy": null,
        "sqlType": "Point", // required
        "referenceType": "obs-location", // required
        "presetValues": null,
        "isNullable": true // required
    });

    colNames.splice(longIndex, 1);
    colNames.splice(latIndex, 1);
}
let columns = colNames.map(key => generateSchemaColumns(key));

// Schema 
fs.writeFileSync(__dirname + '/features.jsonc', JSON.stringify(features));
fs.writeFileSync(__dirname + '/columns.jsonc', JSON.stringify(columns));

// submissionObject
let submissionObject = {
    "items": {
        "create": [
            {
                "itemTypeID": 17,
                "requiredItems": [],
                "newRequiredItemIndices": [],
                "globalPrimaryKey": 1,
                "newGlobalItemIndex": null,
                "data": {
                    "returnableIDs": [
                        464
                    ],
                    "data": [
                        1
                    ]
                }
            }
        ],
        "update": [],
        "delete": [],
        "requestPermanentDeletion": []
    },
    "observations": {
        "create": [],
        "update": [],
        "delete": []
    }
}

// first 10k
for(let i = 0; i < 100; i++) {
    let r = [
        162, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193
    ]
    let combined = [
        "02-06-1910",
        "None",
        [],
        ...Object.values(parsed.data[i])
    ].map((e, i) => ({id: r[i], v: e})).filter(obj => obj.v !== null);
    submissionObject.observations.create.push({
        "itemTypeID": 17,
        "itemPrimaryKey": null,
        "newItemIndex": 0,
        "globalPrimaryKey": 1,
        "newGlobalIndex": null,
        "data": {
            "returnableIDs": combined.map(e => e.id),
            "data": combined.map(e => e.v)
        }
    })
}

fs.writeFileSync(__dirname + '/submissionObject.json', JSON.stringify(submissionObject));

function generateSchemaColumns(key) {
    let referenceType;
    let sqlType;
    let presetValues = null;
    let name = formatName(key);
    let information = null;
    let isNullable = true;
    let accuracy = null;
    let featureName = 'Crime Incident';

    const lookup = {};
    let intError = false;
    let floatError = false;
    console.log(name)
    for(let i = 0; i < parsed.data.length - 1; i++) {
        let value = parsed.data[i][key];
        if(value.length == 0) {
            parsed.data[i][key] = null;
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

    function formatName(name) {
        name = name.split(/[_\- ]/);
        name = name.map(substring => substring[0].toUpperCase() + substring.slice(1).toLowerCase());
        name = name.join(' ');
        return name;
    }
}