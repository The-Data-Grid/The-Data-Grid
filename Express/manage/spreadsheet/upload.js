const Excel = require('exceljs');


async function parseSpreadsheet(req, res, next) {
    // Get attached SOPs from body
    let sops = [];
    try {
        sops = JSON.parse(req.body.sops);
    } catch(err) {
        // pass
    }

    // Load worksheet into exceljs
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    // Parse Metadata
    let metaSheet = workbook.getWorksheet('metadata');

    // Parse Data
    let dataSheet = workbook.worksheets[0];

    return res.status(200).end();
}

module.exports = {
    parseSpreadsheet,
}