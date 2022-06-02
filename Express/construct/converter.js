const fs = require('fs');
const csv = require('csv-parser');
const parsed = [];

/*
{
    featureName,
    auditorName,
    geoType,
    featureInformation
}
*/
const options = JSON.parse(fs.readFileSync('csvOptions.json', 'utf-8'))

/*
const resetOptions = {
    itemTypeID: 1,
    itemID returnableID
    location col index
    returnableIDs for observation
}
*/
const TO_BE_FILLED = null;
const TO_BE_FILLED_ARRAY = [];

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
        let cols = generateSchema()
        const obj = {
            "items": {
                "create": [
                    {
                        "itemTypeID": TO_BE_FILLED,
                        "requiredItems": [],
                        "newRequiredItemIndices": [],
                        "globalPrimaryKey": 1,
                        "newGlobalItemIndex": null,
                        "data": {
                            "returnableIDs": TO_BE_FILLED_ARRAY,
                            "data": 1
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
        };
        writeSubmissionObject(cols, 1, obj);
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
            "information": options.featureInformation,
            "name": options.featureName,
            "observableItem": {
                "requiredItem": [
                ]
            }
        }
    ]
    
    let colNames = Object.keys(parsed[0])
    let columns = [];
    columns.push({ 
        "featureName": options.featureName,
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
            "featureName": options.featureName,
            "name": options.featureName + ' Location',
            "information": null, // optional, defaults to null
            "accuracy": null,
            "sqlType": options.geoType, // required
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
        let featureName = options.featureName;
    
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

const geojsonTypeLookup = {
    'Point': 'Point',
    'Line': 'LineString',
    'Region': 'Polygon'
}

function writeSubmissionObject(cols, wroteObjectIndex, obj) {
    // submissionObject
    obj.observations.create.push({
        "itemTypeID": 12,
        "itemPrimaryKey": null,
        "newItemIndex": 0,
        "globalPrimaryKey": 1,
        "newGlobalIndex": null,
        "data": {multiple: true, returnableIDs: [
            'Auditor',
            'Standard Operating Procedure',
            ...cols.map(col => col.name)
        ], data: []}});
    console.log('computing file #' + wroteObjectIndex);
    // 50k at a time
    let startIndex = (wroteObjectIndex - 1) * 50000;
    let stopIndex = Math.min(wroteObjectIndex * 50000, parsed.length);
    for(let i = startIndex; i < stopIndex; i++) {
        let json = null;
        if(parsed[i].LAT != null && parsed[i].LAT.length > 0 && parsed[i].LON != null && parsed[i].LON.length > 0) {
           json = 
                {
                    type: geojsonTypeLookup[options.geoType],
                    coordinates: [parseFloat(parsed[i].LAT), parseFloat(parsed[i].LON)]
                }
        }
        let combined = [
            "City of LA",
            [],
            json,
            ...cols.map(key => parsed[i][key]).map(val => val == '' || val == ' ' ? null : val)
        ];
        obj.observations.create[obj.observations.create.length - 1].data.data.push(combined);
    }
    
    // async write file
    if(stopIndex == parsed.length) {
        console.log('writing file #' + wroteObjectIndex);
        fs.writeFileSync(__dirname + `/submissionObject${wroteObjectIndex}.json`, JSON.stringify(obj));
        console.log('wrote file file #' + wroteObjectIndex);
    } else {
        writeSubmissionObject(cols, wroteObjectIndex + 1, obj);

    }

}
