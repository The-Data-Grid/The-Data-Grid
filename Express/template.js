const ExcelJS = require('exceljs');

// async stream to send file
async function sendWorkbook(workbook, res) { 
    var fileName = 'Audit-Template.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    await workbook.xlsx.write(res);

    res.end(); // ending the response cycle
}

function makeTemplate(req, res) {
    const wb = new ExcelJS.Workbook();
    const sheet1 = wb.addWorksheet('Feature');

    sendWorkbook(wb, res); // async
}


module.exports = {
    makeTemplate
}