const LRU = require('lru-cache')
const { sendDefault, sendDownload } = require('./query.js')

class QueryCache {
    constructor(sizeLimit) {
        this.LRUCache = new LRU(sizeLimit)
    }

    get(key) {
        return this.LRUCache.get(key)
    }
    
    set(key, value) {
        this.LRUCache.set(key, value)
    }

    generateKey(req) {
        return req.originalUrl
    }
}

const CacheLayer = new QueryCache(500_000);

function hitCacheWrapper(isDownload) {
    return (req, res, next) => {
        let cacheStatus = CacheLayer.get(CacheLayer.generateKey(req))
        // if hit then return value
        if(cacheStatus !== undefined) {
            console.log('Cache Hit: ' + CacheLayer.generateKey(req));

            cacheStatus.cached = true;

            // set to formattedResponse so send handlers can see it
            res.locals.formattedResponse = cacheStatus;
            
            // If download use download handler
            if(isDownload) {
                return sendDownload(req, res)
            }

            // If not use the default handler
            else {
                return sendDefault(req, res)
            }

        }
        // else then SQL query
        else {
            console.log('Cache Miss: ' + CacheLayer.generateKey(req));
            next()
        }
    }
}

module.exports = {
    hitCacheDefault: hitCacheWrapper(false),

    hitCacheDownload: hitCacheWrapper(true),

    setCache: (req, res, next) => {
        console.log('Set Cache: ' + res.locals.formattedResponse)
        CacheLayer.set(CacheLayer.generateKey(req), res.locals.formattedResponse)
        next()
    },

    clearCache: () => {
        CacheLayer.LRUCache.reset();
    }
}