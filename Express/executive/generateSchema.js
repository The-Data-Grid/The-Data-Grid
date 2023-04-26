const fs = require('fs');
const multer = require('multer');
const child = require("child_process");

const {
    createNewDatabase,
    checkDatabaseNameIsValid,
    cleanUpFailedDatabaseGeneration
} = require("./executive.js");

function generationError(type, message, cleanupObject={}) {
    // clean up the temp files asynchronously
    cleanUpFailedDatabaseGeneration(cleanupObject)
    // return error message
    return `GENERATIONERROR: ${JSON.stringify({type, message})}`
}

// 1. Download the CSV, GeoJSON, or JSON file
async function download(req, res, next) {
    // get database name and conversion type from query parameter (a little weird for a 
    // POST request but neccessary because multer must pipe to a file before it reads anything)
    res.locals.dbName = req.query.name;
    res.locals.genType = req.query.type;
    if(res.locals.dbName && /[A-Za-z ]{4,20}/.test(res.locals.dbName) && /[A-Za-z]/.test(res.locals.dbName)) {
        res.status(400).write(generationError("Formatting Error", "Database name must contain only letters and spaces and be 4-20 characters."));
        return res.end();
    }
    res.locals.dbSqlName = res.locals.dbName.toLowerCase().replaceAll(" ", "_");

    // First, check for name collision
    const isDatabaseNameValid = await checkDatabaseNameIsValid(res.locals);
    if(!isDatabaseNameValid) {
        res.status(400).write(generationError("Formatting Error", "A Database exists with that name, try another."));
        return res.end();
    }

    // At this point we know that a database doesn't exist with the name that has
    // been given, so on arbitrary errors we can wipe everything without risk of data loss
    try {

        // set header for streaming response
        res.setHeader('Content-Type', 'text/plain');   
        // get api key if it exists
        const fileSize = req.headers["content-length"];
        const dbApiKey = req.headers["DB-API-KEY"];
        if(dbApiKey) {
            // check for validity
            // TODO
            res.locals.hasValidDbApiKey = true;
        } else {
            res.locals.hasValidDbApiKey = false;
        }

        if(res.locals.genType !== "CSV" && res.locals.genType !== "GeoJSON" && res.locals.genType !== "Custom") {
            res.status(400).write(generationError("Formatting Error", "Must use CSV, GeoJSON, or custom JSON."));
            return res.end();
        }
    
        // create temp folder and uploader
        let tempDirName;
        if(res.locals.hasValidDbApiKey) {
            tempDirName = parentDir(__dirname, 1) + "/Schemas/" + res.locals.dbSqlName;
        } else {
            tempDirName = parentDir(__dirname, 1) + "/TempSchemas/" + res.locals.dbSqlName;
        } 
        // make parent dir
        fs.mkdirSync(tempDirName);
        // make schema dir, "default" since entire process is one-shot
        fs.mkdirSync(tempDirName + "/default");
        fs.mkdirSync(tempDirName + "/_internalObjects");
        res.locals.dbTempDirName = tempDirName;
        res.locals.dbLogFileName = res.locals.dbTempDirName + "/default/Schema_Construction_SQL.sql";
        res.locals.dbLogFileNameInsertion = res.locals.dbTempDirName + "/default/Data_Insertion_SQL.sql"
        const upload = multer({ 
            dest: tempDirName + "/default/",
            limits: {fileSize: 10737418240}, // 10 GB limit
            fileFilter: (req, file, cb) => {
                if(file.mimetype !== "text/csv" && file.mimetype !== "application/json") {
                    cb(new Error("Invalid file type. Must be CSV, GeoJSON, or JSON"));
                } else {
                    cb(null, true);
                }
            }
        }).single(res.locals.genType);
        // Track progress
        let progressBytes = 0;
        let progressPercent = 0;
        let progressBar = "[                    ]"
        req.on("data", (chunk) => {
            progressBytes += chunk.length;
            const newProgressPercent = Math.round((progressBytes / fileSize) * 100);
            if(newProgressPercent > progressPercent) {
                progressPercent = newProgressPercent;
                const progressBarCutoff = Math.round(progressPercent / 5);
                progressBar = '[';
                for(let n = 1; n <= 20; n++) {
                    progressBar += n > progressBarCutoff ? ' ' : '#';
                }
                progressBar += ']';
                res.write(`${progressBar} ${progressPercent}%`);
            }
        })
        // Upload the file
        res.write(`${res.locals.genType} received, starting upload...`)
        upload(req, res, (err) => {
            if(err) {
                res.status(400).write(generationError("File Conversion Error", err, {
                    cleanFiles: tempDirName
                }))
                return res.end();
            } else {
                // success, pass to next middleware
                res.write("File successfully uploaded!")
                res.write("Starting conversion to TDG objects...")
                return next();
            }
        });
    } catch(err) {
        res.status(500).write(generationError("File Conversion Error", err, {
            cleanFiles: res.locals.dbTempDirName
        }));
        return res.end();
    }
}

// 2. Convert the CSV, GeoJSON, or JSON file to TDG features.jsonc and columns.jsonc objects
function convert(req, res, next) {
    try {
        // if Custom, destructure features, columns, and submission
        if(res.locals.genType === "Custom") {
            res.write("Using custom objects...");
            const obj = JSON.parse(fs.readFileSync(res.locals.dbTempDirName + "/default/custom.json"));
            // write features and columns
            fs.writeFileSync(res.locals.dbTempDirName + "/default/features.jsonc", obj.features);
            fs.writeFileSync(res.locals.dbTempDirName + "/default/columns.jsonc", obj.columns);
            fs.mkdirSync(`${res.locals.dbTempDirName}/submissionsWithoutReturnables`);
            fs.writeFileSync(res.locals.dbTempDirName + "/submissionsWithoutReturnables/submissionObject_1.jsonc", obj.submission);
            return res.next();
        } else {
            // spawn conversion program
            conversionNodejsProcess = child.execFile(__dirname + "/construct/convert/converter.js", [
                "--parseType=" + req.params.type.toLowerCase(),
                "--featureName=" + res.locals.dbFeatureName,
                "--auditorName=" + "TDG Auto-convert",
                "--tempFolderName=" + res.locals.dbTempDirName + "/default"
            ], (err, stdout, stderr) => {
                if(err) {
                    // clean up
                } else {
                    res.write("File conversion complete!");
                    res.write("Starting database construction...");
                    return next();
                }
            });
        
            // capture logs
            conversionNodejsProcess.stdout.on("data", (data) => {
                res.write(data);
            });
        }
    } catch(err) {
        res.status(500).write(generationError("File Conversion Error", err, {
            cleanFiles: res.locals.dbTempDirName
        }));
        return res.end();
    }
}

// 3. Construct a new database from the TDG objects
async function construct(req, res, next) {
    try {
        // 1. Insert row into executive database
        // 2. Create new database and run v6
        const claimCode = await createNewDatabase(res.locals);
        res.locals.claimCode = claimCode;
    
        res.write("New PostgreSQL database created: " + res.locals.dbSqlName);
    
        // 3. Run construction script on new database
        const constructionParams = [
            "make-schema",
            res.locals.dbSqlName, // database
            "default", // "default" schema for one-shot conversion and generation
            "--postgresdb=" + res.locals.dbSqlName,
            "--streamQueryLogs=" + res.locals.dbLogFileName
        ];
        if(!res.locals.hasValidDbApiKey) {
            constructionParams.push("--temp")
        }
        constructionNodejsProcess = child.execFile(
            __dirname + "/construct/cli.js",
            constructionParams,
            (err, stdout, stderr) => {
                if(err) {
                    // clean up
                } else {
                    res.write("Database successfully constructed!");
                    res.write("Starting data insertion...");
                    return next();
                }
            })
    
        // capture logs
        constructionNodejsProcess.stdout.on("data", (data) => {
            res.write(data);
        });
    } catch(err) {
        res.status(500).write(generationError("Database Construction Error", err, {
            cleanFiles: res.locals.dbTempDirName,
            cleanDatabase: {
                dbName: res.locals.dbSqlName,
                executiveDatabaseConnection: res.locals.databaseConnection
            }
        }));
        return res.end();
    }
}

// 4. Fill the submissionObject with correct returnable IDs
function fillReturnables(req, res, next) {
    try {
        fillReturnablesNodejsProcess = child.execFile(
            __dirname + "/construct/convert/fillReturnables.js",
            [
                "--featureName=" + res.locals.dbFeatureName,
                "--dbFolderName=" + res.locals.dbTempDirName,
                "--schema=default" 
            ],
            (err, stdout, stderr) => {
                if(err) {
                    // clean up
                } else {
                    res.write("Successfully filled returnables...");
                    return next();
                }
            }
        )
    
        // capture logs
        fillReturnablesNodejsProcess.stdout.on("data", (data) => {
            res.write(data);
        });
    } catch(err) {
        res.status(500).write(generationError("Data Insertion Error", err, {
            cleanFiles: res.locals.dbTempDirName,
            cleanDatabase: {
                dbName: res.locals.dbSqlName,
                executiveDatabaseConnection: res.locals.databaseConnection
            }
        }));
        return res.end();
    }
}

// 5. Write internalObjects.js to the database folder
function preprocess(req, res, next) {
    try {
        const setupParams = ["--postgresdb=" + res.locals.dbSqlName];
        if(!res.locals.hasValidDbApiKey) {
            setupParams.push("--temp");
        }
        preprocessNodejsProcess = child.execFile(
            __dirname + "/preprocess/setup.js",
            setupParams,
            (err, stdout, stderr) => {
                if(err) {
                    // clean up
                } else {
                    res.write("Successfully completed preprocessing...");
                    return next();
                }
            }
        )
    
        // capture logs
        preprocessNodejsProcess.stdout.on("data", (data) => {
            res.write(data);
        });
    } catch(err) {
        res.status(500).write(generationError("Data Insertion Error", err, {
            cleanFiles: res.locals.dbTempDirName,
            cleanDatabase: {
                dbName: res.locals.dbSqlName,
                executiveDatabaseConnection: res.locals.databaseConnection
            }
        }));
        return res.end();
    }
}

// 6. Insert the data into the database
function insert(req, res, next) {
    try {
        insertNodejsProcess = child.execFile(
            __dirname + "/insert/manual.js",
            [
                "--postgresdb=" + res.locals.dbSqlName,
                "--dbFolderName=" + res.locals.dbTempDirName,
                "--schema=default",
                "--streamQueryLogs=" + res.locals.dbLogFileNameInsertion
            ],
            (err, stdout, stderr) => {
                if(err) {
                    // clean up
                } else {
                    res.write("Successfully inserted all data!");
                    res.status(201)
                    res.end();
                }
            }
        )
    
        // capture logs
        insertNodejsProcess.stdout.on("data", (data) => {
            res.write(data);
        });
    } catch(err) {
        res.status(500).write(generationError("Data Insertion Error", err, {
            cleanFiles: res.locals.dbTempDirName,
            cleanDatabase: {
                dbName: res.locals.dbSqlName,
                executiveDatabaseConnection: res.locals.databaseConnection
            }
        }));
        return res.end();
    }
}

function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}

module.exports = {
    download,
    convert,
    construct,
    fillReturnables,
    preprocess,
    insert,
}