// Construction CLI //
// ============================================================

// Imports
const { asyncConstructAuditingTables } = require('./constructor.js'); // Main schema constructor function
const fs = require('fs'); // Node.js File System
const stripJsonComments = require('strip-json-comments'); // .jsonc handling
const chalk = require('chalk'); // pretty console.log

// SQL Statements
const {
    getReturnables, 
} = require('../statement.js').construct
const { allItems } = require('../statement.js').setup

// Database connection and SQL formatter
const { postgresClient, connectPostgreSQL } = require('../pg.js');
connectPostgreSQL('construct') // Establish an new connection pool
const db = postgresClient.getConnection.cdb; // get connection object
const formatSQL = postgresClient.format; // get SQL formatter


// remove boilerplate argv elements
process.argv.splice(0, 2);

console.log(chalk.blue.bold(`Running ${process.argv[0]}`));

if(process.argv[0] == 'make-schema') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv[0];
    process.argv.splice(0, 1);
    // configure command line arguments
    (process.argv.includes('--show-computed') || process.argv.includes('-sc') ? commandLineArgs.showComputed = true : commandLineArgs.showComputed = false);
    // here we go
    makeSchema(commandLineArgs);
} 
else if(process.argv[0] == 'config') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // get and remove audit type
    commandLineArgs.schema = process.argv[0];
    process.argv.splice(0, 1);
    // configure command line arguments
    let argFile = process.argv.filter(arg => /^--file=.*/.test(arg));
    if(argFile.length != 1) throw 'One file must be specified as a command line argument with \'--file=yourFile\'';
    commandLineArgs.file = argFile[0].match(/^--file=(.*)/)[1];
    (process.argv.includes('--show-computed') || process.argv.includes('-sc') ? commandLineArgs.showComputed = true : commandLineArgs.showComputed = false);
    // here we go
    configSchema(commandLineArgs);
} 
else if(process.argv[0] == 'inspect') {
    let commandLineArgs = {};
    // remove command
    process.argv.splice(0, 1);
    // configure command line arguments
    if(process.argv.includes('--returnable') || process.argv.includes('-r')) {
        commandLineArgs.type = 'r'
        let argFilter = process.argv.filter(arg => /^--choose=.*/.test(arg));
        commandLineArgs.isSummary = process.argv.includes('-s') || process.argv.includes('--summary');
        commandLineArgs.isTree = process.argv.includes('-t') || process.argv.includes('--tree');
        commandLineArgs.isQueryString = process.argv.includes('-qs') || process.argv.includes('--query-string');
        commandLineArgs.isFullyIdentifyingSet = process.argv.includes('-fis') || process.argv.includes('--fully-identifying-set');
        if(argFilter.length == 1) {
            commandLineArgs.filter = argFilter[0].match(/^--choose=(.*)/)[1];
        } else {
            commandLineArgs.filter = null;
        }
        (process.argv.includes('-u') || process.argv.includes('--used') ? commandLineArgs.used = true : commandLineArgs.used = false);
    } else if(process.argv.includes('--feature') || process.argv.includes('-f')) {
        commandLineArgs.type = 'f'
    } else if(process.argv.includes('--column') || process.argv.includes('-c')) {
        commandLineArgs.type = 'c'
    } else if(process.argv.includes('--item') || process.argv.includes('-i')) {
        commandLineArgs.type = 'i';
    } else {
        throw Error('\'construct inspect\' requires flag of \'-r\', \'-f\', \'-i\', or \'-c\'')
    }
    // here we go
    inspectSchema(commandLineArgs);
} else {
    console.log('Not a valid construction command');
    process.exit(9);
};



// CLI Functions //
// ============================================================
async function makeSchema(commandLineArgs) {

    // Start task
    // no transactions because procedure calls cannot be made inside transactions
    db.task(async taskDatabaseConnection => {
        const databaseObject = {
            db: taskDatabaseConnection,
            formatSQL,
        };

        // Read schema
        // Columns
        let columns = readSchema(parentDir(__dirname, 2) + `/Schemas/${commandLineArgs.schema}/columns.jsonc`);
        let globalColumns = readSchema(parentDir(__dirname, 2) + '/Schemas/globalSchema/columns.jsonc');
        // Features
        let features = readSchema(parentDir(__dirname, 2) + `/Schemas/${commandLineArgs.schema}/features.jsonc`);

        // Call Construction Function
        const featureOutput = await asyncConstructAuditingTables(features, [...columns, ...globalColumns], databaseObject);

        // Creating the computed file and returnables folder 
        await showComputed(commandLineArgs, databaseObject);

        // Creating schema assets
        await makeAssets(featureOutput, databaseObject);
    })
    // Successful construction
        .then(() => {
            // Done!
            console.log(chalk.blueBright.bgWhiteBright('\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
            console.log(chalk.blueBright.bgWhiteBright('                             '));
            console.log(chalk.green.bgWhiteBright('   Successful Construction   '));
            console.log(chalk.blueBright.bgWhiteBright('                             '));
            console.log(chalk.blueBright.bgWhiteBright('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
            console.log(chalk.black.bgWhiteBright(' Long live the power source! '));

            // Closing the database connection
            db.$pool.end;
            console.log('Closed PostgreSQL Connection: construct');

            process.exit(0);
        })
    // Error during construction
        .catch(err => {
            console.log(err);
            console.log(chalk.redBright.bold('Schema Construction Failed'));
            console.log(chalk.redBright.bold('Database must be dropped'));

            // Closing the database connection
            db.$pool.end;
            console.log('Closed PostgreSQL Connection: construct');

            process.exit(1);
        });
}

async function configSchema(commandLineArgs) {
    //console.log(commandLineArgs)

    let schema = commandLineArgs.schema;
    let file = commandLineArgs.file;

    let controller = readSchema(parentDir(__dirname) + `/auditSchemas/${schema}/${file}`);

    // sanity check
    if(controller.IDs.length !== controller.controller.length) {
        throw Error('Controller error: IDs and controller must be the same length');
    }

    // for every change
    for(let id of controller.IDs) {
        let change = controller.controller[controller.IDs.indexOf(id)]
        // if isUsed exists db.none
        if('isUsed' in change) {
            db.none(formatSQL('UPDATE metadata_returnable SET is_used = $(isUsed) WHERE returnable_id = $(id)', {
                isUsed: change.isUsed,
                id: id
            }));

            console.log(chalk.green(`Config: is_used column of ReturnableID:${id} updated to ${change.isUsed}`));
        }
        // if frontendName exists db.none
        if('frontendName' in change) {
            db.none(formatSQL('UPDATE metadata_returnable SET frontend_name = $(frontendName) WHERE returnable_id = $(id)', {
                frontendName: change.frontendName,
                id: id
            }));

            console.log(chalk.green(`Config: frontend_name column of ReturnableID:${id} updated to ${change.frontendName}`));
        }
    }      

    await showComputed(commandLineArgs);

    // Closing the database connection
    db.$pool.end
    console.log('Closed PostgreSQL Connection: construct')
}

async function inspectSchema(commandLineArgs) {
    let out;

    if(commandLineArgs.type === 'r') {

        if(commandLineArgs.used === true) {
            if(commandLineArgs.filter !== null) {
                // if non observational
                if(/^item_.*/.test(commandLineArgs.filter)) {
                    out = await db.any(formatSQL('SELECT * FROM metadata_returnable AS r join metadata_item as i on r.item_id = i.item_id WHERE i.table_name = $(item) AND r.is_used = true', {
                        item: commandLineArgs.filter
                    }))
                } else {
                    out = await db.any(formatSQL('SELECT * FROM metadata_returnable AS r WHERE r.feature_id = (SELECT feature_id FROM metadata_feature WHERE table_name = $(filter)) AND r.is_used = true', {
                        filter: commandLineArgs.filter
                    }));
                }

            } else {
                out = await db.any('SELECT * FROM metadata_returnable WHERE is_used = true')
            }
        } else {
            if(commandLineArgs.filter !== null) {
                // if non observational
                if(/^item_.*/.test(commandLineArgs.filter)) {
                    out = await db.any('SELECT * FROM returnable_view as r WHERE r.non_obs_i__table_name = $(item)', {
                        item: commandLineArgs.filter
                    })
                } else {
                    out = await db.any(formatSQL('SELECT * FROM returnable_view as r WHERE r.f__table_name = $(filter)', {
                        filter: commandLineArgs.filter
                    }));
                }

                // if FIS trim to only include FIS returnables
                /*

                Not done yet because not only item-id returnables must be selected, but also
                only returnables that traverse ID required items. Going to need to write a handler for this 
                for upload anyway...
                
                Update: Handler is written for upload, need to add


                if(commandLineArgs.isFullyIdentifyingSet) {
                    ...
                    
                }
                */
                
                if(commandLineArgs.isSummary) {
                    const originalOut = Array.from(out);
                    out = {};
                    originalOut.forEach(r => {
                        out[r.r__returnable_id] = r.r__frontend_name
                    })
                } else if(commandLineArgs.isTree) {
                    const originalOut = Array.from(out);
                    out = {};
                    originalOut.forEach(r => {
                        // this is just formatting
                        out[r.r__returnable_id] = (r.r__join_object.tables.length > 0 ? `${r.r__join_object.tables.filter((e,i) => (i % 2 == 0 || i+1 == r.r__join_object.tables.length )).join(' > ')}: ${r.r__frontend_name}` : (/^item_.*/.test(commandLineArgs.filter) ? r.non_obs_i__table_name : r.f__table_name) + ': ' + r.r__frontend_name)
                    })
                } else if(commandLineArgs.isQueryString) {
                    const originalOut = Array.from(out);
                    // If you're reading this I'm sorry
                    out = [originalOut.length, originalOut.map(r => r.r__returnable_id).join('&')]
                }
                
            } else {
                out = await db.any('SELECT * FROM metadata_returnable')
            }
        }
        
    } else if(commandLineArgs.type === 'f') {
        out = await db.any('SELECT * FROM metadata_feature');
    } else if(commandLineArgs.type === 'c') {
        out = await db.any('SELECT * FROM metadata_column');
    } else if(commandLineArgs.type === 'i') {
        out = await db.any('SELECT * FROM metadata_item');
    }

    let count = (commandLineArgs.isSummary || commandLineArgs.isTree ? Object.keys(out).length : out.length)

    // handling for query string
    // I'm really sorry I know this sucks a lot
    if(commandLineArgs.isQueryString) {
        count = out[0]
        out = out[1]        
    }

    console.log(out)
    console.log(chalk.cyanBright.underline(`Count: ${count}`))

    // Closing the database connection
    db.$pool.end
    console.log('Closed PostgreSQL Connection: construct')
}

async function makeAssets(featureOutput, databaseObject) {
    const {itemIDColumnLookup, featureItemLookup, itemRealGeoLookup, itemParentLookup} = featureOutput;
    const {db} = databaseObject;
    
    // Adding files to ./Express/schemaAssets
    fs.writeFileSync(parentDir(__dirname) + `/schemaAssets/itemIDColumnLookup.json`, JSON.stringify(itemIDColumnLookup))
    console.log(chalk.whiteBright.bold(`Wrote itemIDColumnLookup.json to schemaAssets`));

    fs.writeFileSync(parentDir(__dirname) + `/schemaAssets/itemParentLookup.json`, JSON.stringify(itemParentLookup))
    console.log(chalk.whiteBright.bold(`Wrote itemParentLookup.json to schemaAssets`));

    fs.writeFileSync(parentDir(__dirname) + `/schemaAssets/featureItemLookup.json`, JSON.stringify(featureItemLookup));
    console.log(chalk.whiteBright.bold(`Wrote featireItemLookup.json to schemaAssets`));

    fs.writeFileSync(parentDir(__dirname) + `/schemaAssets/itemRealGeoLookup.json`, JSON.stringify(itemRealGeoLookup));
    console.log(chalk.whiteBright.bold(`Wrote itemRealGeoLookup.json to schemaAssets`));
    
    fs.writeFileSync(parentDir(__dirname) + `/schemaAssets/allItems.json`, JSON.stringify(await db.many(allItems)));
    console.log(chalk.whiteBright.bold(`Wrote allItems.json to schemaAssets`));    
}

async function showComputed(commandLineArgs, databaseObject) {
    const {db} = databaseObject;
    // Creating the computed file and returnables folder 
    if(commandLineArgs.showComputed === true) {
       console.log(chalk.whiteBright.bold(`Writing returnables to the ${commandLineArgs.schema} folder`));

       fs.mkdirSync(parentDir(__dirname) + '/schemaAssets/returnables/' + commandLineArgs.schema, {recursive: true})
       console.log(chalk.whiteBright.bold(`Made directory /schemaAssets/returnables/${commandLineArgs.schema}`));

       let currentReturnables = await db.many(getReturnables);
       currentReturnables = JSON.stringify(currentReturnables);

       // writing the JSON
       fs.writeFileSync(parentDir(__dirname) + `/schemaAssets/returnables/${commandLineArgs.schema}/computedAt-${Date.now()}.json`, currentReturnables);
       console.log(chalk.whiteBright.bold(`Wrote computedAt-${Date.now()}.json to /schemaAssets/returnables/${commandLineArgs.schema}`));
    }   
}

function readSchema(file) { // Schema read function
    return JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')))
}

function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}