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
const { 
    userName,
    featureName 
    } = require('../../statement.js').generate;

//connect to db
const { postgresClient } = require('../../db/pg.js'); 
const indexOf = require('lodash/indexOf');
const db = postgresClient.getConnection.db;
const formatSQL = postgresClient.format;

function getXlsxFormattingType(referenceType, SQLType) {
    const referenceTypeGroups = {
        'obs': 1,
        'obs-global': 1,
        'special': 1,
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
        featureID: parseInt(req.query.featureID)+1, // frontend giving featureID-1, so temp fix of adding 1.
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

/**
 * * Meta information object
 * @typedef {Object} spreadsheetMetaObject
 * @property {String} organizationId
 * @property {String} userId
 * @property {String} featureID // setup
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

async function generateSpreadsheet (req, res) {
    const {
        spreadsheetMetaObject,
        spreadsheetColumnObjectArray
    } = res.locals.spreadsheetObjects;

    // create workbook
    let workbook = new excel.Workbook();

    // get user's name from ID - query not working right now, fix. 
    /*
    const user = (await db.one(formatSQL(userName), {
        user_id: spreadsheetMetaObject.userID
    })).user_name;
    */

    // set workbook properties
    //workbook.creator = user;
    workbook.creator = 'Yash';
    workbook.lastModifiedBy = 'The Data Grid';
    workbook.created = new Date();
    workbook.modified = new Date();

    // INSTRUCTION SHEET
    // let instructionsSheet = workbook.addWorksheet('Instructions');
    // instructionsSheet = setupInstructions(instructionsSheet);

    // METADATA SHEET
    // let metadataSheet = workbook.addWorksheet('Metadata');
    // metadataSheet = setupMetadata(metadataSheet);

    // get frontend name for feature
    const feature = (await db.one(formatSQL(featureName), {
        feature_id: spreadsheetMetaObject.featureID
    })).table_name;

    // setup Feature Data Sheet
    workbook = setupFeatureData(workbook, feature, spreadsheetMetaObject, spreadsheetColumnObjectArray);

    /* Protect file */
    // await worksheet.protect('password', options)

    // export file to xlsx 
    const buffer = await workbook.xlsx.writeBuffer();
    res.writeHead(200, [
        ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ["Content-Disposition", "attachment; filename=" + `template.xlsx`]
    ]);
    res.end(Buffer.from(buffer, 'base64'));
    console.log('Spreadsheet generated.');
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

function setupTitle(dataSheet, title) {

    // main title section

    dataSheet.mergeCells('A1:F3');
    let titleBox = dataSheet.getCell('A1');

    titleBox.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cfe2f3'},
    };

    titleBox.value = {
        'richText': [
            {'font': {'bold': true, 'size': 20, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
             'text': title},
        ]
    };

    titleBox.alignment = {
        vertical: 'middle',
        indent: 2,
        wrapText: false
    };

    titleBox.protection = {
        locked: true,
        lockText: true
    };

    return dataSheet;
}

function setupInfoBox(dataSheet, dateCreated) {

    dataSheet.mergeCells('G1:S3'); 
    let infoBox = dataSheet.getCell('G1');

    infoBox.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cfe2f3'}
    };

    infoBox.border = {
        right: {style: 'thick', color: {argb: '4a86e8'}}
    };

    infoBox.value = {
        'richText': [
            {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
             'text': 'Spreadsheet generated by '},
            {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
            'text': 'The Data Grid ', 'hyperlinks': { 'hyperlink': 'https://thedatagrid.org/', 'tooltip': 'https://thedatagrid.org/' }},
            {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
            'text': 'at ' + dateCreated + ' for ' },
            {'font': {'bold': true, 'size': 12, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
             'text': 'Bruin Home Solutions.' }
        ]
    };

    infoBox.alignment = {
        vertical: 'middle',
        indent: 2,
        wrapText: false
    };
   
    infoBox.protection = {
        locked: true,
        hidden: true,
    };

    return dataSheet;
}

function setupGrayBorder(dataSheet){

    dataSheet.mergeCells('A4:S4');
    let grayBox = dataSheet.getCell('A4');

    grayBox.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cccccc'}
    };

    grayBox.protection = {
        locked: true,
        lockText: true
    };

    grayBox.border = {
        right: {style: 'thick', color: {argb: '4a86e8'}}
    };

    /*
    dataSheet.mergeCells('A4:G4');
    let grayBox1 = dataSheet.getCell('G4');

    // gray box 1 includes orange border for required section

    grayBox1.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cccccc'}
    };

    grayBox1.border = {
        top: {style: 'thick', color: {argb: '4a86e8'}},
        bottom: {style: 'thick', color: {argb: 'e69138'}},
    };

    grayBox1.protection = {
        locked: true,
        hidden: true
    };

    // gray box 2 is any space not covered by orange border for required sections

    dataSheet.mergeCells('H4:P4');
    let grayBox2 = dataSheet.getCell('P4');

    grayBox2.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cccccc'}
    };

    grayBox2.border = {
        top: {style: 'thick', color: {argb: '4a86e8'}},
    };

    grayBox2.protection = {
        locked: true,
        hidden: true
    };
    */

    return dataSheet;
}

/**
 * * Meta information object
 * @typedef {Object} spreadsheetMetaObject
 * @property {String} organizationId
 * @property {String} userId
 * @property {String} featureID // setup
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

function sortSpreadsheetColumnObjects(spreadsheetColumnObjectArray) {

    let colObjsNullable = [];
    let colObjsNotNullable = [];

    for (const obj in spreadsheetColumnObjectArray) {

        if (obj.isNullable) {
            colObjsNullable.push(obj);
        } else {
            colObjsNotNullable.push(obj);
        }
    }

    // returns array with nullable objects first, preceded by not nullable objects
    return colObjsNullable.concat(colObjsNotNullable);
}

function spannedColumns(startColumnChar, numColumns) {

    const incrementedChar = String.fromCharCode(startColumnChar.charCodeAt(0) + numColumns);
    if (incrementedChar > 'S') {
        return ['A', String.fromCharCode('A'.charCodeAt(0) + numColumns)];
    } else {
        return [startColumnChar, incrementedChar];
    }

}

function setupColumns(dataSheet, spreadsheetColumnObjectArray) {

    // setup orange border

    dataSheet.mergeCells('A5:S5');
    let orangeBorder = dataSheet.getCell('A5');

    orangeBorder.border = {
        top: {style: 'thick', color: {argb: 'e69138'}},
        bottom: {style: 'thick', color: {argb: 'e69138'}}
    };

    // track column for columnObject placement
    let colNum = 'A';

    // track largest number of rows used
    let largestRow = 0;

    // sort column objects
    const columnObjects = sortSpreadsheetColumnObjects(spreadsheetColumnObjectArray);
    
    for (let i = 0; i < columnObjects.length; i++) {

        const colObj = columnObjects[i];
        console.log(colObj);

        switch (colObj.xlsxFormattingType){

            case 'text':
                break;
            
            case 'date':
                break;

            case 'decimal':
                break;
            
            case 'wholeNumber':
                break;
            
            case 'checkbox':
                break;

            case 'checkboxList':
                break;
            
            case 'dropdown':
                break;

            default:
                console.log('Error');
                break;
        }
    }


    /*
    // required cell

    let requiredHeader = dataSheet.getCell('D5');

    requiredHeader.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'f4cccc'}
    }

    requiredHeader.value = {
        'richText': [
            {'font': {'bold': false, 'italic': true, 'size': 12, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
             'text': 'Required'},
        ]
    };

    requiredHeader.border = {
        top: {style: 'thick', color: {argb: 'e69138'}},
        bottom: {style: 'thick', color: {argb: 'e69138'}}
    };

    requiredHeader.alignment = {
        horizontal: 'center'
    }

    // required section borders

    dataSheet.mergeCells('A5:C5');
    let borderRequired1 = dataSheet.getCell('C5');
    
    borderRequired1.border = {
        top: {style: 'thick', color: {argb: 'e69138'}},
        bottom: {style: 'thick', color: {argb: 'e69138'}}
    };

    dataSheet.mergeCells('E5:G5');
    let borderRequired2 = dataSheet.getCell('G5');
    
    borderRequired2.border = {
        top: {style: 'thick', color: {argb: 'e69138'}},
        bottom: {style: 'thick', color: {argb: 'e69138'}}
    };
    */

    return dataSheet;
}

function setupColumnInformation(dataSheet, spreadsheetColumnObjectArray) {

    let rowNum = 20; //temp

    // setup column information section

    dataSheet.mergeCells('A' + rowNum + ':' + 'C' + rowNum);
    let infoTitleBox = dataSheet.getCell('A' + rowNum);

    infoTitleBox.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: '38761d'}
    };

    infoTitleBox.value = {
        'richText': [
            {'font': {'bold': true, 'size': 12, 'name': 'Arial', 'color': {'argb': 'ffffff'}, 'family': 2, 'scheme': 'minor'}, 
            'text': 'Column Information'},
        ]
    };

    infoTitleBox.protection = {
        locked: true,
        lockText: true
    };

    infoTitleBox.border = {
        bottom: {style: 'thick', color: {argb: '38761d'}}
    };

    // setup empty space after column information

    dataSheet.mergeCells('D' + rowNum + ':' + 'P' + rowNum);
    let whiteBar = dataSheet.getCell('D' + rowNum);
    
    whiteBar.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'ffffff'}
    };

    whiteBar.protection = {
        locked: true,
        lockText: true
    };

    whiteBar.border = {
        bottom: {style: 'thick', color: {argb: '38761d'}}
    };
    
    // setup column information 

    for (let i = 0; i < spreadsheetColumnObjectArray.length; i++) {
        
        // get obj
        const colObj = spreadsheetColumnObjectArray[i];

        // increment row
        rowNum+=1;
        
        // setup name of column

        dataSheet.mergeCells('A' + rowNum + ':' + 'C' + rowNum);
        let colName = dataSheet.getCell('A' + rowNum);

        colName.style.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'b6d7a8'}
        };

        colName.value = {
            'richText': [
                {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'argb': '000000'}, 'family': 2, 'scheme': 'minor'}, 
                'text': colObj.frontendName},
            ]
        };

        colName.alignment = {
            wrapText: false
        };

        // setup information of column

        dataSheet.mergeCells('D' + rowNum + ':' + 'P' + rowNum);
        let colInfo = dataSheet.getCell('D' + rowNum);

        colInfo.style.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'd9ead3'}
        }

        if (colObj.information !== null){
            colInfo.value = {
                'richText': [
                    {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'argb': '000000'}, 'family': 2, 'scheme': 'minor'}, 
                    'text': colObj.information},
                ]
            };
        }

        colName.border = {
            bottom: {style: 'hair', color: {argb: '000000'}}
        }

        colInfo.border = {
            right: {style: 'thick', color: {argb: '38761d'}},
            bottom: {style: 'hair', color: {argb: '000000'}}
        }
    }

    // add border on bottom
    
    rowNum += 1;
    dataSheet.mergeCells('A' + rowNum + ':' + 'P' + rowNum);
    let colInfoBorder = dataSheet.getCell('A' + rowNum);

    colInfoBorder.border = {
        top: {style: 'thick', color: {argb: '38761d'}}
    };

    return dataSheet;
}

function setupFeatureData(workbook, feature, spreadsheetMetaObject, spreadsheetColumnObjectArray) {

    let title;
    if (spreadsheetMetaObject.isItem) {
        title = feature + ' Item Audit';
    } else {
        title = feature + ' Observation Audit'
    }
        
    // create sheet
    let dataSheet = workbook.addWorksheet(feature + ' Data');

    // meta properties of sheet
    dataSheet.state = 'visible';

    dataSheet = setupTitle(dataSheet, title);
    dataSheet = setupInfoBox(dataSheet, workbook.created);
    dataSheet = setupGrayBorder(dataSheet);
    dataSheet = setupColumns(dataSheet, spreadsheetColumnObjectArray);
    dataSheet = setupColumnInformation(dataSheet, spreadsheetColumnObjectArray);

    return workbook;
}

module.exports = { 
    setupSpreadsheet,
    formatObjectsSpreadsheet,
    generateSpreadsheet,
    itemOrObservationQuery,
};