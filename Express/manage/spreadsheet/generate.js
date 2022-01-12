const excel = require('exceljs');
const express = require('express');
const { 
    itemFISLookup,
    observationFISLookup,
    itemLocalReturnableLookup,
    observationLocalReturnableLookup,
    itemTableNames,
    featureTableNames,
} = require('../../setup.js');
const { x } = require('joi');
const { itemQuery, featureQuery } = require('../../query/query.js');
const { getPresetValues } = require('../../query/direct.js');

function getXlsxFormattingType(referenceType, SQLType) {
    const referenceTypeGroups = {
        obs: 1,
        'obs-global': 1,
        special: 1,
        'item-non-id': 1,
        'item-id': 1,
        'obs-list': 2,
        'item-list': 2,
        'attribute': 3,
        'factor': 3,
        'item-location': 4
    };

    const SQLTypeGroups = {
        TEXT: 'a',
        NUMERIC: 'b',
        INTEGER: 'c',
        TIMESTAMPTZ: 'd',
        BOOLEAN: 'e',
        Point: 'f',
        LineString: 'f',
        Polygon: 'f'
    };

    const arrayMap = {
        a: ['text', 'checkboxList', 'dropdown', null],
        b: ['decimal', 'checkboxList', 'dropdown', null],
        c: ['wholeNumber', 'checkboxList', 'dropdown', null],
        d: ['date', 'checkboxList', 'dropdown', null],
        e: ['checkbox', 'checkboxList', null, null],
        f: [null, null, null, 'text'], // will change with intelligent location handling
    };

    return arrayMap[SQLTypeGroups[SQLType]][referenceTypeGroups[referenceType] - 1];
}

/**
 * * Meta information object
 * @typedef {Object} spreadsheetMetaObject
 * @property {String} organizationId
 * @property {String} userId
 * @property {String} featureID
 * @property {String} action
 * @property {Boolean} isItem true: item, false: observation
 * 
 * * spreadsheetColumnObject
 * @typedef {Object} spreadsheetColumnObject
 * @property {String} frontendName 
 * @property {String | null} information 
 * @property {Number} returnableID 
 * @property {Number} colId 
 * @property {Boolean} isNullable 
 * @property {String} xlsxFormattingType
 * @property {String[] | null} presetValues
 * 
 * @param {spreadsheetMetaObject} spreadsheetMetaObject 
 * @param {spreadsheetColumnObject[]} spreadsheetColumnObjectArray
 */

// metadata setup
async function setupSpreadsheet (req, res, next) {
    // 1. Check org permission to upload to this feature
    // ... wait until added feature based org permissions

    // 2. spreadsheetMetaObject
    const spreadsheetMetaObject = {
        organizationID: res.locals.requestedOrganizationID,
        userID: res.locals.authorization.userID,
        featureID: parseInt(req.query.featureID),
        isItem: req.query.isItem === 'true',
        action: 'upload',
    };
    const spreadsheetColumnObjectArray = [];

    // 3. spreadsheetColumnObject
    // local columns
    let FIS;
    let FISReturnables;
    let backendName;
    let tableName;
    let localReturnables;
    if(req.query.isItem === 'true') {
        // get table name
        tableName = itemTableNames[req.query.featureID];
        localReturnables = itemLocalReturnableLookup[tableName];

        FIS = itemFISLookup[tableName];
        FISReturnables = FIS.map(returnable => returnable.r__returnable_id);
        backendName = tableName.match(/^item_(.*)/)[1];

    } else {
        // get table name
        tableName = featureTableNames[req.query.featureID];
        localReturnables = observationLocalReturnableLookup[tableName];

        FIS = observationFISLookup[tableName];
        FISReturnables = FIS.map(returnable => returnable.r__returnable_id);
        backendName = tableName.match(/^(?:sub)?observation_(.*)/)[1];
    }
    /**
     *  * @property {String} frontendName 
        * @property {String | null} information 
        * @property {Number} returnableID 
        * @property {Number} colId 
        * @property {Boolean} isNullable 
        * @property {String} xlsxFormattingType
        * @property {String[] | null} presetValues
     */
    const presetValueReferenceTypes = req.query.isItem === 'true' ? ['obs-list', 'attribute', 'obs-factor'] : ['item-list', 'attribute', 'item-factor'];
    // format spreadsheetColumnObjects
    for(let returnable of [...localReturnables, ...FIS]) {
        const spreadsheetColumnObject = {};
        // get dropdowns
        spreadsheetColumnObject.presetValues = null;
        if(presetValueReferenceTypes.includes(returnable.rt__type_name)) {
            spreadsheetColumnObject.presetValues = await getPresetValues(returnable.c__column_name, returnable.c__table_name);
        }
        // name
        spreadsheetColumnObject.frontendName = returnable.r__frontend_name;
        // info
        spreadsheetColumnObject.information = returnable.c__information;
        // returnableID
        spreadsheetColumnObject.returnableID = returnable.r__returnable_id;
        spreadsheetColumnObject.columnID = returnable.c__column_id;
        spreadsheetColumnObject.isNullable = returnable.c__is_nullable;
        spreadsheetColumnObject.xlsxFormattingType = getXlsxFormattingType(returnable.rt__type_name, returnable.sql__type_name);

        spreadsheetColumnObjectArray.push(spreadsheetColumnObject);
    }

    // add parsed properties to request for use by next query middleware
    res.locals.parsed = {};
    res.locals.parsed.request = "audit";
    res.locals.parsed.features = backendName;
    res.locals.parsed.columns = FISReturnables;
    res.locals.parsed.filters = [];
    res.locals.parsed.universalFilters = {};

    // add meta object for generator middleware
    res.locals.spreadsheetObjects = {
        spreadsheetMetaObject,
        spreadsheetColumnObjectArray
    };

    return next();
}

function itemOrObservationQuery(req, res, next) {
    if(res.locals.spreadsheetObjects.spreadsheetMetaObject.isItem) {
        itemQuery(req, res, next);
    } else {
        featureQuery(req, res, next);
    }
}

function formatObjectsSpreadsheet(req, res, next) {
    res.locals.formattedResponse.returnableIDs.forEach((returnable, i) =>  {
        const objectIndex = res.locals.spreadsheetObjects.spreadsheetColumnObjectArray.map(r => r.returnableID).indexOf(returnable);
        // inject presets
        res.locals.spreadsheetObjects.spreadsheetColumnObjectArray[objectIndex].presetValues = res.locals.formattedResponse.columnData[i];
    });

    return next();
}


function setupInstructions(instructionsSheet) {
    instructionsSheet.state = 'visible';
    instructionsSheet.properties = {
        // add styling to tab colors / outlines?
    };
    instructionsSheet.pageSetup = {
        // setup row count, column count
    }

    return instructionsSheet;
}

function setupMetadata(metadataSheet) {
    metadataSheet.state = 'visible';
    metadataSheet.properties = {
        // add styling to tab colors / outlines?
    };
    metadataSheet.pageSetup = {
        // setup row count, column count
    }
    
    return metadataSheet;
}

function setupFeatureData(feature, dataSheet) {
    dataSheet.state = 'visible';
    dataSheet.properties = {
        // add styling to tab colors / outlines?
    };
    dataSheet.pageSetup = {
        // setup row count, column count
    }

    /* setup title cell */
    dataSheet.mergeCells('A1:E3');
    let titleBox = dataSheet.getCell('A1');
    titleBox.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cfe2f3'},
    };

    titleBox.value = {
        'richText': [
            {'font': {'bold': true, 'size': 18, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
             'text': feature + ' Audit'},
        ]
    };

    titleBox.alignment = {
        vertical: 'middle',
        //horizontal: 'middle',
        indent: 2
    };

    titleBox.protection = {
        locked: true,
        hidden: true
    };

    /*
    dataSheet.getCell('E3').style.border = {
        bottom: {style: 'thick', color: {argb: '3c78d8'}}
    };
    */

    let infoBox = dataSheet.getCell('F1').style;
    infoBox.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cfe2f3'}
    };
    /*
    infoBox.border = {
        bottom: {style: 'thick', color: {argb: '3c78d8'}}
    };
    */
    infoBox.protection = {
        locked: true,
        hidden: true,
    };

    // setup tdg cell
    dataSheet.mergeCells('F1', 'L3')

    // setup border cell
    dataSheet.mergeCells('A4:L4');

    return dataSheet;
}


/**
 * * Meta information object
 * @typedef {Object} spreadsheetMetaObject
 * @property {Number} orgId
 * @property {Number} userId
 * @property {String} featureFrontendName
 * @property {String} action
 * @property {Boolean} isItem true: item, false: observation
 * @property {Number} itemTypeID
 * 
 * * spreadsheetColumnObject
 * @typedef {Object} spreadsheetColumnObject
 * @property {String} frontendName 
 * @property {String | null} information 
 * @property {Number} returnableID 
 * @property {Number} colId 
 * @property {Boolean} isNullable 
 * @property {String} xlsxFormattingType
 * @property {String[] | null} presetValues
 * 
 * @param {spreadsheetMetaObject} spreadsheetMetaObject 
 * @param {spreadsheetColumnObject[]} spreadsheetColumnObjectArray
 */

async function generateSpreadsheet (req, res) {
    const {
        spreadsheetMetaObject,
        spreadsheetColumnObjectArray
    } = res.locals.spreadsheetObjects;

    // create workbook
    const workbook = new excel.Workbook();

    // set workbook properties
    workbook.creator = ''; // set creator as auditorName or TDG?
    workbook.lastModifiedBy = 'The Data Grid';
    workbook.created = new Date();
    workbook.modified = new Date();

    // force workbook calculation on load
    workbook.calcProperties.fullCalcOnLoad = true;

    const feature = spreadsheetMetaObject.featureFrontendName;

    /* INSTRUCTION SHEET */
    // let instructionsSheet = workbook.addWorksheet('Instructions');
    // instructionsSheet = setupInstructions(instructionsSheet);

    /* METADATA SHEET */
    // let metadataSheet = workbook.addWorksheet('Metadata');
    // metadataSheet = setupMetadata(metadataSheet);
    
    /* FEATURE DATA SHEET */
    let dataSheet = workbook.addWorksheet(feature + ' Data');
    dataSheet = setupFeatureData(feature, dataSheet);

    /* Protect file */
    // await worksheet.protect('password', options)

    /* Send file to client */
    await workbook.xlsx.writeFile('./temp.xlsx').then(() => {
        console.log('Spreadsheet generated.');
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.writeHead(200, [
        ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ["Content-Disposition", "attachment; filename=" + `template.xlsx`]
    ]);
    res.end(Buffer.from(buffer, 'base64'));

    /*
    const file = tempfile('.xlsx');
    await workbook.xlsx.writeFile(file)
        .then(() => {
            res.sendFile(file, err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err);
        });
    */
}

module.exports = { 
    setupSpreadsheet,
    formatObjectsSpreadsheet,
    generateSpreadsheet,
    itemOrObservationQuery,
};