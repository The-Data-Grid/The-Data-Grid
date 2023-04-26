// Executive Node.js process which manages TDG instances by doing the following:
// - Create new databases
// - Delete databases

const express = require('express'); 
const router = express.Router();
const { getExecutiveConnection } = require('../pg.js').postgresClient;	


const {
    download,
    convert,
    construct,
    fillReturnables,
    preprocess,
    insert,
} = require("./generateSchema.js");

const {
    allDatabases
} = require("./executive.js");

// Attach the executive database connection to the request
router.use((req, res, next) => {
    res.locals.executiveDatabaseConnection = getExecutiveConnection;
    return next();
})

router.post("/generate", 
    download,
    convert,
    construct,
    fillReturnables,
    preprocess,
    insert
)

router.get("/databases", allDatabases)

module.exports = router;