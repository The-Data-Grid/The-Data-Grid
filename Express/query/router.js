const express = require('express'); 
const router = express.Router(); //use router instead of app

// Middleware
const parse = require('../parse/parse.js');
const query = require('./query.js');
const { validateObservation, validateItem } = require('../parse/validate.js')
const cacheLayer = require('./cacheLayer.js');
const template = require('../manage/spreadsheet/template.js');
const { authorizeObservationQuery, authorizeItemQuery } =  require('../auth/authorizer.js');

//** Observation Key Query **/	
router.get('/observation/key/:feature', 
    parse.keyQueryParse, 
    validateObservation, 
    authorizeObservationQuery,
    query.featureQuery, 
    query.sendKey);

//** Observation Data Query **//	
router.get('/observation/:feature/:include',
    parse.queryParse, 
    validateObservation, 
    authorizeObservationQuery,
    cacheLayer.hitCacheDefault,
    query.featureQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDefault);

//** Observation Data Query w/ Download **//	
router.get('/observation/download/:downloadType/:feature/:include',
    cacheLayer.hitCacheDownload, 
    parse.queryParse, 
    validateObservation, 
    authorizeObservationQuery,
    cacheLayer.hitCacheDownload, 
    query.featureQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDownload);

//** Observation Distinct Query **/	
router.get('/observation/distinct/:feature/:include',
    parse.queryParse, 
    authorizeObservationQuery,
    validateObservation, 
    cacheLayer.hitCacheDefault,
    query.featureQuery, 
    query.formatDistinct,
    cacheLayer.setCache,
    query.sendDistinct);


//** Item Key Query **//	
router.get('/item/key/:feature', 
    parse.keyQueryParse, 
    validateItem, 
    authorizeItemQuery,
    query.itemQuery, 
    query.sendKey);

//** Item Data Query **//	
router.get('/item/:feature/:include',
    parse.queryParse,
    validateItem, 
    authorizeItemQuery,
    cacheLayer.hitCacheDefault,
    query.itemQuery,
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDefault);

//** Item Data Query w/ Download **//	
router.get('/item/download/:downloadType/:feature/:include',
    cacheLayer.hitCacheDownload,
    parse.queryParse, 
    validateItem, 
    authorizeItemQuery,
    cacheLayer.hitCacheDownload,
    query.itemQuery, 
    query.formatDefault,
    cacheLayer.setCache,
    query.sendDownload);

//** Item Distinct Query **//	
router.get('/item/distinct/:feature/:include', 
    parse.queryParse,
    validateItem, 
    authorizeItemQuery, 
    cacheLayer.hitCacheDefault,
    query.itemQuery, 
    query.formatDistinct,
    cacheLayer.setCache,
    query.sendDistinct);

module.exports = router;