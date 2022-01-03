const excel = require('exceljs');
const express = require('express');
const { x } = require('joi');
/*
const {
    FISLookup,
    localReturnableLookup,
} = require('../setup.js');
*/
// metadata setup
/*
Get all of the local columns (for user entry)
    All returnables that have item, 
        Is local. not the root, rather of the returnable tree 
        Returnable table name = column table name
    If dropdown or checkboxList, query list_…/factor_…/attribute_… table for values
    Format into the spreadsheet with the table above
Get FIS of item's required items (for user selection)
    For each required item
        Get all item-id returnables
        Query /item/<name>/distinct/<returnableID> to get dropdown values    
        Format into the spreadsheet with values as a dropdown

*/
/**
 * @returns {spreadsheetMetaObject, spreadsheetColumnObject}
 */
function setup (orgId, userId, feature, action, isItem) {
    // 1. Check org permission to upload to this feature

    // 2. spreadsheetMetaObject
    
    // 3. spreadsheetColumnObject
    // local columns
    const localReturnables = getLocalReturnables(feature, isItem);

    const presetValues = getPresetValues(localReturnables);
    const spreadsheetColumnObject = formatSpreadsheetColumnObject(localReturnables, presetValues);
    
    return {
        spreadsheetColumnObject,
        spreadsheetMetaObject,
    };
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
 * @property {String} orgId
 * @property {String} userId
 * @property {String} featureFrontendName
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

async function generateSpreadsheet (spreadsheetMetaObject, spreadsheetColumnObjectArray) {
    // create workbook
    const workbook = new excel.Workbook();

    // set workbook properties
    workbook.creator = ''; // set creator as auditorName or TDG?
    workbook.lastModifiedBy = 'The Data Grid';
    workbook.created = new Date();
    workbook.modified = new Date();

    // force workbook calculation on load
    workbook.calcProperties.fullCalcOnLoad = true;

    const feature = spreadsheetMetaObject.featureFrontendName; // what do we get feature from?

    /* INSTRUCTION SHEET */
    // let instructionsSheet = workbook.addWorksheet('Instructions');
    // instructionsSheet = setupInstructions(instructionsSheet);

    /* METADATA SHEET */
    // let metadataSheet = workbook.addWorksheet('Metadata');
    // metadataSheet = setupMetadata(metadataSheet);
    
    /* FEATURE DATA SHEET */
    let dataSheet = workbook.addWorksheet(feature + ' Data');
    // dataSheet = setupFeatureData(feature, dataSheet);

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

    /* Protect file */
    // await worksheet.protect('password', options)

    /* Send file to client */
    await workbook.xlsx.writeFile('./temp.xlsx').then(() => {
        console.log('Spreadsheet generated.');
    });

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
    generateSpreadsheet
}