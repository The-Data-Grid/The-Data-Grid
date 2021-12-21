const excel = require('exceljs');

// metadata setup
function setup () {}

// format and generate spreadsheet
function generate (auditorName, frontendName, information, returnableID, colId, isNullable) {
    
    const workbook = new excel.Workbook();

    // set workbook properties
    workbook.creator = auditorName; // set creator as auditorName or TDG?
    workbook.lastModifiedBy = 'The Data Grid';
    workbook.created = new Date();
    workbook.modified = new Date();

    // force workbook calculation on load
    workbook.calcProperties.fullCalcOnLoad = true;

    const feature = ''; // what do we get feature from?

    /* INSTRUCTION SHEET */
    const instructionsSheet = workbook.addWorksheet('Instructions');

    /* METADATA SHEET */
    const metadataSheet = workbook.addWorksheet('Metadata');

    /* FEATURE DATA SHEET */
    const dataSheet = workbook.addWorksheet(feature + ' Data');

    // setup title cells
    dataSheet.mergeCells('A1', 'E3');
    let titleBox = dataSheet.getCell('A1').style;
    titleBox.fill = {
        type: 'pattern',
        pattern: 'solid',
        bgColor:{argb:'cfe2f3'}
    }

    titleBox.border = {
        bottom: {style:''}
    }

    titleBox.protection = {
        locked: true,
        hidden: true
    }

    // setup tdg cell
    dataSheet.mergeCells('F1', 'L3')

    // setup border cell
    dataSheet.mergeCells('A4:L4');



    // return res.sendFile(...)
}

module.exports = {
    
}