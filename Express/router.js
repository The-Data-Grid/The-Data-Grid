const express = require('express'); 
const router = express.Router(); // use router instead of app

// Middleware
const { setupParse } = require('./parse/parse.js');
const { sendSetup, sendMobileSetup, sendFilterSetup } = require('./query/query.js');
const insertRouter = require('./insert/router.js').router;
const auditRouter = require('./query/router.js');
const authRouter = require('./auth/router.js');
const managementRouter = require('./manage/router.js');
const setSession = require('./auth/session.js');
const parseCredentials = require('./auth/parseCredentials.js');

// Session and format request authorization credentials
router.use('/', setSession, parseCredentials)

// User Management API Router
router.use('/user', authRouter);

// Audit Upload API Router
router.use('/audit/submission', insertRouter);

// Audit API Router
router.use('/audit', auditRouter);

// Setup Object
router.get('/setup', setupParse, sendSetup);

// Setup Mobile Object
router.get('/setup/mobile', setupParse, sendMobileSetup);

// Filter Setup Object
router.get('/setup/filter', setupParse, sendFilterSetup);

// Audit and Organization management router
// router.use('/manage', managementRouter);

module.exports = router;