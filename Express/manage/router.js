const express = require('express'); 
const router = express.Router(); //use router instead of app

// Middleware
const parse = require('../parse.js');
const query = require('../query/query.js');
const { validateObservation, validateItem } = require('../validate.js')
const cacheLayer = require('../query/cacheLayer.js');
const template = require('../template.js');
const { authorizeObservationQuery, authorizeItemQuery } =  require('../auth/authorizer.js');
const { sendSignedUrl } = require('./signedUrl.js');
const { authorizeAuditor } = require('../auth/authorizer.js');
const { parseOrganizationID } = require('../parse.js');


router.get('/audits', parseOrganizationID, authorizeAuditor, query.auditManagment);

router.get('/signed-url', parseForSignedUrl, authorizeAuditor, sendSignedUrl);

router.get('/sops', parseOrganizationID, authorizeAuditor, query.sopManagement);

function parseForSignedUrl(req, res, next) {
    try {
        if(!req.query.organizationID || !req.query.type || !req.query.fileName || isNaN(parseInt(req.query.organizationID))) {
            return res.status(400).end();
        }

        res.locals.requestedOrganizationID = parseInt(req.query.organizationID);
        res.locals.contentType = req.query.type;
        res.locals.fileName = req.query.fileName;

        return next();
    } catch(err) {
        return res.status(500).end();
    }
}

module.exports = router;