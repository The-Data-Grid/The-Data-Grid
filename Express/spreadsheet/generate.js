const {
    FISLookup,
    localReturnableLookup,
} = require('../setup.js');

// middleware req res get ordID, isItem, feature

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

// format and generate spreadsheet
/**

 */
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
 * @param {spreadsheetColumnObject[]} spreadsheetColumnObject 
 */
function generate (spreadsheetMetaObject, spreadsheetColumnObject) {
    // return res.sendFile(...)
}