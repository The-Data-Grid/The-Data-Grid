const express = require('express'); 
const router = express.Router(); //use router instead of app

// File Parsing
const multer  = require('multer');
const uploadFile = multer()

// Middleware
const parse = require('../parse/parse.js');
const { formatDistinct } = require('../query/query.js');
const { auditManagment, sopManagement, generateApiKey } = require('../query/direct.js');
const { validateObservation, validateItem } = require('../parse/validate.js')
const cacheLayer = require('../query/cacheLayer.js');
const template = require('./spreadsheet/template.js');
const { sendSignedUrl } = require('./signedUrl.js');
const { authorizeAuditor, authorizeAuditorAnyOrg } = require('../auth/authorizer.js');
const { parseOrganizationID, parseSignedUrl } = require('../parse/parse.js');
const { itemOrObservationQuery, setupSpreadsheet, formatObjectsSpreadsheet, generateSpreadsheet } = require('./spreadsheet/generate.js');
const { parseSpreadsheet } = require('./spreadsheet/upload.js');


router.get('/audits', 
    parseOrganizationID,
    authorizeAuditor,
    auditManagment
    );

router.get('/signed-url',
    parseSignedUrl,
    authorizeAuditor,
    sendSignedUrl);

router.get('/sops',
    parseOrganizationID,
    authorizeAuditor,
    sopManagement);

router.get('/spreadsheet',
    (req, res, next) => {
        res.locals.timer = Date.now();
        next();
    },  
    parseOrganizationID,
    authorizeAuditor,
    setupSpreadsheet, 
    itemOrObservationQuery, 
    formatDistinct, 
    formatObjectsSpreadsheet, 
    generateSpreadsheet);

router.post('/spreadsheet', 
    parseOrganizationID, 
    authorizeAuditor,  
    uploadFile.single('spreadsheet'), 
    parseSpreadsheet);

router.put('/key', 
    authorizeAuditorAnyOrg, 
    generateApiKey({ remove: false }));

router.delete('/key', 
    authorizeAuditorAnyOrg, 
    generateApiKey({ remove: true }));

module.exports = router;