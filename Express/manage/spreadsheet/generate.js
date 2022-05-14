const excel = require('exceljs');
const express = require('express');
const { 
    itemFISLookup,
    observationFISLookup,
    itemLocalReturnableLookup,
    observationLocalReturnableLookup,
    itemTableNames,
    featureTableNames,
    allItems,
    observationItemTableNameLookup,
    columnObjects,
    itemColumnObject,
} = require('../../preprocess/load.js');
const { x } = require('joi');
const { itemQuery, featureQuery } = require('../../query/query.js');
const { getPresetValues } = require('../../query/direct.js');
const { 
    userName    
} = require('../../statement.js').generate;

//connect to db
const { postgresClient } = require('../../pg.js'); 
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
 * @property {Number} columnId 
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

    // Parse number of spreadsheet rows
    let nRows;
    try {
        nRows = parseInt(req.query.nRows);
    } catch(err) {
        return res.status(400).send('nRows must be an integer');
    }

    // 2. spreadsheetMetaObject
    const spreadsheetMetaObject = {
        organizationID: res.locals.requestedOrganizationID,
        userID: res.locals.authorization.userID,
        featureID: parseInt(req.query.featureID)+1, // frontend giving featureID-1, so temp fix of adding 1.
        isItem: req.query.isItem === 'true',
        nRows,
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
        
        // remove SOP because it is added with the UI
        localReturnables = localReturnables.filter(obj => obj.c__frontend_name !== 'Standard Operating Procedure');

        FIS = observationFISLookup[tableName];
        FISReturnables = FIS.map(returnable => returnable.r__returnable_id);
        backendName = tableName.match(/^(?:sub)?observation_(.*)/)[1];
    }

    const presetValueReferenceTypes = req.query.isItem === 'true' ? ['item-list', 'attribute', 'item-factor'] : ['obs-list', 'attribute', 'obs-factor'];
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
        // inject item requirement presets
        res.locals.spreadsheetObjects.spreadsheetColumnObjectArray[objectIndex].presetValues = res.locals.formattedResponse.columnData[i];
        
        // Make a selectable dropdown for every column in the FIS, so the spreadsheet has selections to identify the item being
        // audited. In the case of item upload, make the local ID columns in the FIS text fields, because these must be new
        // values to create a new unique item
        const featureID = res.locals.spreadsheetObjects.spreadsheetMetaObject.featureID;
        const columnID = res.locals.spreadsheetObjects.spreadsheetColumnObjectArray[objectIndex].columnID;
        const relevantColumnObjectInfo = columnObjects[columnID - 1].additionalInfo;
        if(!(res.locals.spreadsheetObjects.spreadsheetMetaObject.isItem && 
            (relevantColumnObjectInfo.referenceType == 'item-id' && itemColumnObject[itemTableNames[featureID - 1]].c__column_id.includes(columnID)))) {
            res.locals.spreadsheetObjects.spreadsheetColumnObjectArray[objectIndex].xlsxFormattingType = 'dropdown';
        } 
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
 * @property {Number} columnId 
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

    // get user's name from ID 
    const user = (await db.one(formatSQL(userName), {
        user_id: spreadsheetMetaObject.userID
    }));
    
    // set workbook properties
    workbook.creator = user.first_name + ' ' + user.last_name;
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
    let feature;
    if(spreadsheetMetaObject.isItem) {
        feature = allItems.filter(item => item.i__item_id === spreadsheetMetaObject.featureID)[0].i__frontend_name;
    } else {
        let itemTableName = observationItemTableNameLookup[featureTableNames[spreadsheetMetaObject.featureID - 1]];
        feature = allItems.filter(item => item.i__table_name === itemTableName)[0].i__frontend_name;
    }

    // setup Feature Data Sheet
    workbook = setupFeatureData(workbook, feature, spreadsheetMetaObject, spreadsheetColumnObjectArray);

    // setup Field Information Sheet
    let fieldInformationSheet = workbook.addWorksheet('Field Information');
    fieldInformationSheet = setupFieldInformation(fieldInformationSheet, spreadsheetColumnObjectArray);

    // set dateFormat of feature worksheet
    const options = {
        dateFormat: ['MM-DD-YYYY']
    };

    /*
    for (let i = 0; i < workbook.worksheets.length; i++){
        let sheet = workbook.worksheets[i];
        // Protect worksheet 
        await sheet.protect('password', options);
    }
    */

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

function formatSpannedCells(startCol, endCol, rowNum){
    if (endCol) {
        return startCol + rowNum + ':' + endCol + rowNum;
    } else {
        return startCol + rowNum;
    }
}

function setupFieldInformation(fieldInformationSheet, spreadsheetColumnObjectArray) {

    // initialize column widths 

    let rowNum = 1;
    let titleStartCol = 'A';
    let titleEndCol = 'B';
    let infoStartCol = 'C';
    let infoEndCol = 'Z';

    // border style
    const borderStyle = {style: 'thick', color: {argb: '38761d'}};

    // setup column information title

    fieldInformationSheet.mergeCells(formatSpannedCells(titleStartCol, titleEndCol, rowNum));
    let infoTitleBox = fieldInformationSheet.getCell(formatSpannedCells(titleStartCol, null, rowNum));

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
        bottom: borderStyle
    };

    // setup empty space after column information
    
    fieldInformationSheet.mergeCells(formatSpannedCells(infoStartCol, infoEndCol, rowNum));
    let whiteBar = fieldInformationSheet.getCell(formatSpannedCells(infoEndCol, null, rowNum));
    
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
        botom: borderStyle,
        right: borderStyle
    };
    
    // setup column information 
    
    for (const i in spreadsheetColumnObjectArray) {
        
        // get obj
        const colObj = spreadsheetColumnObjectArray[i];

        // increment row
        rowNum+=1;
        
        // place name of column

        fieldInformationSheet.mergeCells(formatSpannedCells(titleStartCol, titleEndCol, rowNum));
        let colName = fieldInformationSheet.getCell(formatSpannedCells(titleStartCol, null, rowNum));

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

        colName.border = {
            right: borderStyle
        }

        // input information of column

        fieldInformationSheet.mergeCells(formatSpannedCells(infoStartCol, infoEndCol, rowNum));
        let colInfo = fieldInformationSheet.getCell(formatSpannedCells(infoEndCol, null, rowNum));

        colInfo.style.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'd9ead3'}
        };

        colInfo.border = {
            right: borderStyle
        };

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
        };

        colInfo.border = {
            bottom: {style: 'hair', color: {argb: '000000'}}
        };
    }

    rowNum += 1;
    fieldInformationSheet.mergeCells(formatSpannedCells('A', 'P', rowNum));
    let bottomBar = fieldInformationSheet.getCell(formatSpannedCells('A', null, rowNum));

    bottomBar.border = {
        top: borderStyle
    }

    return fieldInformationSheet;
}

/* Sets up Feature Data Sheet */

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

    // format date
    const date = workbook.created.toLocaleDateString("en-US");

    dataSheet = setupTitle(dataSheet, title);
    dataSheet = setupInfoBox(dataSheet, date);
    dataSheet = setupGrayBorder(dataSheet);
    dataSheet = setupColumns(dataSheet, spreadsheetColumnObjectArray);

    return workbook;
}

/* Helpers for Feature Data Sheet */

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

    // info section

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
            'text': 'on ' + dateCreated + ' for ' },
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

    // spreadsheet key
    dataSheet.mergeCells(formatSpannedCells('T', 'V', 4));
    let key = dataSheet.getCell(formatSpannedCells('T', null, 4));

    key.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'fd908a'}
    };

    key.value = {
        'richText': [
            {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'theme': 1}, 'family': 2, 'scheme': 'minor'}, 
             'text': '* = required column'},
        ]
    };

    return dataSheet;
}

function setupGrayBorder(dataSheet){

    // create gray border underneath title and info section

    dataSheet.mergeCells('A4:S4');
    let grayBox = dataSheet.getCell('A4');

    grayBox.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'cccccc'}
    };

    grayBox.border = {
        right: {style: 'thick', color: {argb: '4a86e8'}}
    };

    grayBox.protection = {
        locked: true,
        lockText: true
    };

    return dataSheet;
}

// there's probably a recursive solution that's better than my solution now, but that can be something we improve on as product scales
function spannedColumns(startColumnChar, numColumns) {

    // determines columns spanned from 'A' - 'ZZ'
    const lastChar = String.fromCharCode(startColumnChar.charCodeAt(startColumnChar.slice(-1)) + numColumns);

    // case for columns that overlap from a character before 'Z' to the next set of columns
    if (lastChar > 'Z') {
        return [startColumnChar, incOverlappingLetters(startColumnChar, numColumns)]
    }
    // characters incremented between 'A' - 'Z'
    else {
        // account for when columns have 2 letters - only change last character
        if (startColumnChar.length > 1) {
            let chars = incLastChar(startColumnChar, numColumns);
            return [startColumnChar, chars];
        } else {
            return [startColumnChar, String.fromCharCode(startColumnChar.charCodeAt(0) + numColumns)];
        }
    }
}

function incOverlappingLetters(columnChar, numColumns) {
    let firstLetter = 'A';
    let numAdd = numColumns - ('Z'.charCodeAt(0) - columnChar.slice(-1).charCodeAt(0)) - 1;
    // account for when columns begin to have 2 letters
    if (columnChar.length > 1) {
        firstLetter = String.fromCharCode(columnChar[0].charCodeAt(0)+1);
    }
    const secondLetter = String.fromCharCode('A'.charCodeAt(0) + numAdd);
    return firstLetter + secondLetter;
}

function incLastChar(endCol, num) {
    let nextCol = endCol.split('');
    if (String.fromCharCode(nextCol[nextCol.length-1].charCodeAt(0) + num) > 'Z') {
        if (endCol.length > 1){
            nextCol = incOverlappingLetters(endCol, num).split('');
        } else {
            nextCol[nextCol.length-1] = incOverlappingLetters(endCol, num);
        }
    } else {
        nextCol[nextCol.length-1] = String.fromCharCode(nextCol[nextCol.length-1].charCodeAt(0) + num);
    }
    return nextCol.join('');
}

function createColumns(dataSheet, columnName, columnChar, rowNum, colObj, numRows) {

    const format = colObj.xlsxFormattingType;
    const presetValues = colObj.presetValues;
    let textColor = '0058FF'; 
    let fillColor = '71A2FF';
    let numCols = 2;

    if (format === 'dropdown') {
        fillColor = 'FFDD8E';
        textColor = 'FFB300';
    }

    if (format === 'checkboxList') {
        numCols = (colObj.presetValues.length - 1)*2;
        textColor = '38761D';
        fillColor = 'D9EAD3';
    }

    // get spanned columns and determine row to place objects
    const columns = spannedColumns(columnChar, numCols);
    let startCol = columns[0];
    let endCol = columns[1];

    // place column title
    dataSheet.mergeCells(formatSpannedCells(startCol, endCol, rowNum));
    let colName = dataSheet.getCell(formatSpannedCells(startCol, null, rowNum));

    colName.value = {
        'richText': [
            {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'argb': textColor}, 'family': 2, 'scheme': 'minor'}, 
            'text': columnName},
        ]
    };

    colName.protection = {
        locked: true,
        lockText: true
    };

    rowNum +=1;
    if (format !== 'checkboxList') {

        dataSheet.mergeCells(formatSpannedCells(startCol, endCol, rowNum));
        let filled = dataSheet.getCell(formatSpannedCells(startCol, null, rowNum));
        filled.style.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: fillColor}
        };
        dataSheet = createInputBox(dataSheet, format, startCol, endCol, rowNum+1, numRows, fillColor, colObj.isNullable, presetValues);
    } else {

        let nextCol = startCol;

        for (let i = 0; i < presetValues.length; i++) {
            let endNextCol = incLastChar(nextCol, 1);
            dataSheet.mergeCells(formatSpannedCells(nextCol, endNextCol, rowNum));
            let column = dataSheet.getCell(formatSpannedCells(nextCol, null, rowNum));
            column.style.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'd9ead3'}
            };

            column.value = {
                'richText': [
                    {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'argb': textColor}, 'family': 2, 'scheme': 'minor'}, 
                    'text': presetValues[i]},
                ]
            };

            dataSheet = createInputBox(dataSheet, format, nextCol, endNextCol, rowNum+1, numRows, fillColor, colObj.isNullable, presetValues);

            if (i < presetValues.length-1){
                nextCol = incLastChar(nextCol, 2);
            }
        }
        endCol = incLastChar(nextCol,1);
    }
    return {sheet: dataSheet, spannedColumns: [startCol, endCol], nextColumn: incLastChar(endCol, 1)};
}

function createInputBox(dataSheet, format, startCol, endCol, rowNum, numRows, borderColor, isNullable, presetValues) {

    for (let i = 0; i < numRows; i++){
        dataSheet.mergeCells(formatSpannedCells(startCol, endCol, rowNum));
        let inputBox = dataSheet.getCell(formatSpannedCells(startCol, null, rowNum));

        const borderStyle = {style: 'thin', color: {argb: borderColor}};

        inputBox.border = {
            top: borderStyle,
            left: borderStyle,
            right: borderStyle,
            bottom: borderStyle
        };

        switch (format) {

            case 'date':

                // template for date in cell
                inputBox.value = {
                    'richText': [
                        {'font': {'bold': false, 'size': 12, 'name': 'Arial', 'color': {'argb': '000000'}, 'family': 2, 'scheme': 'minor'}, 
                        'text': 'MM-DD-YYYY'},
                    ]
                };

                inputBox.dataValidation = {
                    type: 'text',
                    allowBlank: isNullable,
                    promptTile: 'Date',
                    showErrorMessage: true,
                    errorStyle: 'error',
                    errorTitle: 'Invalid Input.',
                    error: 'The value must be a valid date.'
                }
                
                break;

            case 'decimal':
                inputBox.dataValidation = {
                    type: 'decimal',
                    allowBlank: isNullable,
                    promptTitle: 'Decimal',
                    errorStyle: 'error',
                    errorTitle: 'Invalid input.',
                    error: 'The value must be a decimal.'
                };
                break;
            
            case 'wholeNumber':
                inputBox.dataValidation = {
                    type: 'whole',
                    allowBlank: isNullable,
                    promptTitle: 'Integer',
                    errorStyle: 'error',
                    errorTitle: 'Invalid input.',
                    error: 'The value must be an integer / whole number.'
                };
                break;
            
            case 'checkbox':
                inputBox.dataValidation = {
                    type: 'list',
                    allowBlank: isNullable,
                    formulae: ['"True,False"'],
                    errorStyle: 'error',
                    errorTitle: 'Invalid input.',
                    error: 'True or False must be selected.'
                };
                break;

            case 'checkboxList':
                inputBox.dataValidation = {
                    type: 'list',
                    allowBlank: isNullable,
                    formulae: ['"True,False"'],
                    errorStyle: 'error',
                    errorTitle: 'Invalid input.',
                    error: 'True or False must be selected.'
                };
                break;
            
            case 'dropdown':
                // First need to remove all commas (",") because they can only be used as
                // a separator, then join each value with a comma
                let dropdownVals = presetValues.map(str => String(str).replaceAll(',', '')).join(",");
                inputBox.dataValidation = {
                    type: 'list',
                    allowBlank: isNullable,
                    formulae: [`"${dropdownVals}"`],
                    errorStyle: 'error',
                    errorTitle: 'Invalid input.',
                    error: 'One of the values must be selected.'
                };
                
                break;
        }

        inputBox.protection = {
            locked: false,
            lockText: false
        };

        rowNum += 1;
    }
    return dataSheet;
}

function setupColumns(dataSheet, spreadsheetColumnObjectArray) {

    // track columns for columnObject placement
    let startCol = 'A';
    let endCol = '';
    let nextCol = 'A';

    // track row for columnObject placement
    let rowNum = 6;

    // sort column objects
    for (let i = 0; i < spreadsheetColumnObjectArray.length; i++) {

        const colObj = spreadsheetColumnObjectArray[i];

        let columnName = colObj.frontendName;
    
        if (!colObj.isNullable) {
            columnName += '*';
        }

        const numRows = 500;

        let colHeader = createColumns(dataSheet, columnName, nextCol, rowNum, colObj, numRows);
        dataSheet = colHeader.sheet;
        startCol = colHeader.spannedColumns[0];
        endCol = colHeader.spannedColumns[1];
        nextCol = colHeader.nextColumn;
    }
    return dataSheet;
}

module.exports = { 
    setupSpreadsheet,
    formatObjectsSpreadsheet,
    generateSpreadsheet,
    itemOrObservationQuery,
};