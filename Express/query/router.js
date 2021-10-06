const express = require('express'); 
const router = express.Router(); //use router instead of app

// Middleware
const parse = require('../parse.js');
const query = require('./query.js');
const { validateObservation, validateItem } = require('../validate.js')
const cacheLayer = require('./cacheLayer.js');
const template = require('../template.js');
const { authorizeQuery } =  require('../auth/authorizer.js');

// Authorize
router.use('/', authorizeQuery);

//** Observation Key Query **/	
router.get('/observation/key/:feature', 
    parse.keyQueryParse, 
    validateObservation, 
    query.featureQuery, 
    query.sendKey);

//** Observation Data Query **//	
router.get('/observation/:feature/:include',
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateObservation, 
    query.featureQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDefault);

//** Observation Data Query w/ Download **//	
router.get('/download/:downloadType/observation/:feature/:include',
    cacheLayer.hitCacheDownload, 
    parse.queryParse, 
    validateObservation, 
    query.featureQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDownload);

//** Observation Distinct Query **/	
router.get('/observation/distinct/:feature/:include',
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateObservation, 
    query.featureQuery, 
    query.formatDistinct,
    cacheLayer.setCache,
    query.sendDistinct);


//** Item Key Query **//	
router.get('/item/key/:feature', 
    parse.keyQueryParse, 
    validateItem, 
    query.itemQuery, 
    query.sendKey);

//** Item Data Query **//	
router.get('/item/:feature/:include',
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateItem, 
    query.itemQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDefault);

//** Item Data Query w/ Download **//	
router.get('/download/:downloadType/item/:feature/:include',
    cacheLayer.hitCacheDownload,
    parse.queryParse, 
    validateItem, 
    query.itemQuery, 
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDownload);

//** Item Distinct Query **//	
router.get('/item/distinct/:feature/:include', 
    cacheLayer.hitCacheDefault,
    parse.queryParse, 
    validateItem, 
    query.itemQuery, 
    query.formatDistinct,
    cacheLayer.setCache,
    query.sendDistinct);

module.exports = router;