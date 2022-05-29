const fs = require('fs');
const csv = require('csv-parser');
const parsed = [];

/*
 *  IMPORT DATA
 *  ==========================================================
*/
fs.createReadStream(__dirname + '/data.csv', 'utf-8')
    .pipe(csv())
    .on('data', data => parsed.push(data))
    .on('end', () => {
        console.log('done')
        console.log(Object.keys(parsed[0]))
        let cols = generateSchema();
        writeSubmissionObject(cols, 1);
    })

/*
 *  SCHEMA GENERATION
 *  ==========================================================
*/
let longIndex = null;
let latIndex = null;
function generateSchema() {
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
    
    let colNames = Object.keys(parsed[0])
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
        colNames.some(name => /(?:.*[\s _\-])?[Ll][Oo]?[Nn][Gg]?(?:[\s _\-].*)?/.test(name) || /.*longitude.*/.test(name)) &&
        colNames.some(name => /(?:.*[\s _\-])?[Ll][Aa][Tt](?:[\s _\-].*)?/.test(name) || /.*latitude.*/.test(name))
    ) {
        console.log('lat long found')
        longIndex = colNames.map(name => /(?:.*[\s _\-])?[Ll][Oo]?[Nn][Gg]?(?:[\s _\-].*)?/.test(name) || /.*longitude.*/.test(name)).indexOf(true);
        latIndex = colNames.map(name => name => /(?:.*[\s _\-])?[Ll][Aa][Tt](?:[\s _\-].*)?/.test(name) || /.*latitude.*/.test(name)).indexOf(true);
    
        columns.push({ 
            "featureName": "Crime Incident",
            "name": "Crime Location",
            "information": null, // optional, defaults to null
            "accuracy": null,
            "sqlType": "Point", // required
            "referenceType": "obs", // required
            "presetValues": null,
            "isNullable": true // required
        });
    
        colNames.splice(longIndex, 1);
        colNames.splice(latIndex, 1);
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
        let featureName = 'Crime Incident';
    
        const lookup = {};
        let intError = false;
        let floatError = false;
        console.log(name)
        for(let i = 0; i < parsed.length - 1; i++) {
            let value = parsed[i][key];
            if(value.length == 0) {
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
    
    // Write to file
    fs.writeFileSync(__dirname + '/features.jsonc', JSON.stringify(features));
    fs.writeFileSync(__dirname + '/columns.jsonc', JSON.stringify(columns));

    return colNames;
}

/*
 *  SUBMISSION GENERATION
 *  ==========================================================
*/

function writeSubmissionObject(cols, wroteObjectIndex) {
    // submissionObject
const submissionObject = {
    "items": {
        "create": [
            {
                "itemTypeID": 12,
                "requiredItems": [],
                "newRequiredItemIndices": [],
                "globalPrimaryKey": 1,
                "newGlobalItemIndex": null,
                "data": {
                    "returnableIDs": [
                        194
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

    console.log('computing file #' + wroteObjectIndex);
    // local copy of submissionObject
    submissionObject.items.create[0].data.data[0] = wroteObjectIndex;
    // 50k at a time
    let startIndex = (wroteObjectIndex - 1) * 50000;
    let stopIndex = Math.min(wroteObjectIndex * 50000, parsed.length);
    for(let i = startIndex; i < stopIndex; i++) {
        let r = [
            88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117
        ]
        let json = null;
        if(parsed[i].LAT != null && parsed[i].LAT.length > 0 && parsed[i].LON != null && parsed[i].LON.length > 0) {
           json = 
                {
                    type: 'Point',
                    coordinates: [parseFloat(parsed[i].LAT), parseFloat(parsed[i].LON)]
                }
        }
        let combined = [
            "City of LA",
            [],
            json,
            ...cols.map(key => parsed[i][key])
        ].map((e, i) => ({id: r[i], v: e})).filter(obj => obj.v !== null);
        submissionObject.observations.create.push({
            "itemTypeID": 12,
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
    
    // async write file
    console.log('writing file #' + wroteObjectIndex);
    fs.writeFileSync(__dirname + `/submissionObject${wroteObjectIndex}.json`, JSON.stringify(submissionObject));
    console.log('wrote file file #' + wroteObjectIndex);

    if(stopIndex == parsed.length) {
        console.log('done')
    } else {
        writeSubmissionObject(cols, wroteObjectIndex + 1);
        
    }
}
