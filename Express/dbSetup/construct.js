// TODO: referencing items that were specified
//       make entire thing a transaction?

// SETUP //
const pgp = require("pg-promise")();
const cn = { //connection info
    host: 'localhost',
    port: 5432,
    database: 'tdg_db',
    user: 'postgres',
    password: null,
    max: 1 // use 1 connection
};

// db.function is used for pg-promise queries
const db = pgp(cn);

// Audit type schemas to use for generation
const schema = require("./schema.js")
// END OF SETUP //

// CONSTRUCTION FUNCTIONS AND HELPERS //

// Make ALTER TABLE queries to add foreign key constraints
// Note: This is async and runs after the CREATE TABLE queries
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function asyncConstructRelations(ms) {
    console.log("Setting up foreign key constraints...")
    await timeout(ms); // wait for the CREATE TABLE promises to resolve
    for(let index = 0; index < fkTable.length; index++) {
        db.none(pgp.as.format(reference.default, {fkTable: fkTable[index], fkCol: fkCol[index], pkTable: pkTable[index], pkCol: pkCol[index]}))
    }
    // Closing the connection pool
    console.log("Database built successfully!")
    db.$pool.end();
}


///////////////////////////////
// table creation statements //
///////////////////////////////

const createFeature = {
    default: 'CREATE TABLE feature_$(feature:value) (\
        observation_id SERIAL PRIMARY KEY,\
        submission_id INTEGER NOT NULL,\
        featureitem_id INTEGER NOT NULL,\
        data_date_conducted DATE NOT NULL)',
    additional: 'CREATE TABLE feature_$(feature:value) (\
        observation_id SERIAL PRIMARY KEY,\
        submission_id INTEGER NOT NULL,\
        featureitem_id INTEGER NOT NULL,\
        data_date_conducted DATE NOT NULL,\
        $(additionalCols:value))'    
};

const createSubfeature = {
    default: 'CREATE TABLE subfeature_$(parent:value)_$(subfeature:value) (\
        observation_id SERIAL PRIMARY KEY,\
        parent_id INTEGER NOT NULL,\
        featureitem_id INTEGER NOT NULL,\
        data_date_conducted DATE NOT NULL)',
    additional: 'CREATE TABLE subfeature_$(parent:value)_$(subfeature:value) (\
        observation_id SERIAL PRIMARY KEY,\
        parent_id INTEGER NOT NULL,\
        featureitem_id INTEGER NOT NULL,\
        data_date_conducted DATE NOT NULL, \
        $(additionalCols:value))'
};

const createFeatureitem = {
    default: 'CREATE TABLE featureitem_$(featureitem:value) (\
        featureitem_id SERIAL PRIMARY KEY,\
        data_colloquial_name TEXT NOT NULL,\
        location_id INTEGER NOT NULL)',
    additional: 'CREATE TABLE featureitem_$(featureitem:value) (\
        featureitem_id SERIAL PRIMARY KEY,\
        data_colloquial_name TEXT NOT NULL,\
        location_id INTEGER NOT NULL,\
        $(additionalCols:value))'
};
 
const createListM2M = {
    default: 'CREATE TABLE list_m2m_$(parent:value)_$(list:value) (\
        observation_id INTEGER NOT NULL,\
        list_id INTEGER NOT NULL)'
};

const createList = {
    default: 'CREATE TABLE list_$(parent:value)_$(list:value) (\
        list_id SERIAL PRIMARY KEY,\
        data_elementname TEXT NOT NULL)'
};

const reference = {
    default: 'ALTER TABLE $(fkTable:value) ADD FOREIGN KEY ($(fkCol:value)) REFERENCES $(pkTable:value) ($(pkCol:value))'
};


/////////////////////////////////////////////////////
// Recursive function to construct all subfeatures //
/////////////////////////////////////////////////////

function makeSubfeatures(parent, dependencies) {
    if('subfeatures' in parent) {
        //making subfeature tables
        for(let subfeature in parent.subfeatures) {
            
            //////////////////
            /// SUBFEATURE ///
            //////////////////

            //adding subfeature data and/or items
            
            if('additionalCols' in parent.subfeatures[subfeature]) {
                // CREATE TABLE subfeature_... with additional columns
                let cols = parent.subfeatures[subfeature].additionalCols.join(', ');
                db.none(pgp.as.format(createSubfeature.additional, {subfeature: subfeature, parent: dependencies.join("_"), additionalCols: cols}))
            } else {
                // CREATE TABLE subfeature_... with no additional columns
                db.none(pgp.as.format(createSubfeature.default, {subfeature: subfeature, parent: dependencies.join("_")}))
            };


            //subfeature to feature foreign key
            if(dependencies.length = 1) {
                fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
                fkCol.push('parent_id')
                pkTable.push(`feature_${dependencies.join("_")}`)
                pkCol.push('observation_id')
            } else {
                //subfeature to subfeature foreign key
                fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
                fkCol.push('parent_id')
                pkTable.push(`subfeature_${dependencies.join("_")}`)
                pkCol.push('observation_id')
            }
            
            ///////////////////
            /// FEATUREITEM ///
            /////////////////// 

            //featureitem items and data cols
            if('featureitem' in parent.subfeatures[subfeature]) {
                //adding data and item cols to featureitem
                if('additionalCols' in parent.subfeatures[subfeature].featureitem) {
                    let cols = parent.subfeatures[subfeature].featureitem.additionalCols.join(', ');
                    // CREATE TABLE featureitem_... (featureitem for a subfeature) with additional columns
                    db.none(pgp.as.format(createFeatureitem.additonal, {featureitem: String(dependencies.join("_") + `_${subfeature}`), additionalCols: cols}))
                } else {
                    // CREATE TABLE featureitem_... (featureitem for a subfeature) with no additional columns
                    db.none(pgp.as.format(createFeatureitem.default, {featureitem: String(dependencies.join("_") + `_${subfeature}`)}))
                }

                //featureitem to location foreign key
                if('location' in parent.subfeatures[subfeature].featureitem) { //This has to be true (should be validated)
                    if(['item_room', 'item_bulding'].includes(parent.subfeatures[subfeature].featureitem.location)) {
                        fkTable.push(`featureitem_${dependencies.join("_")}_${subfeature}`);
                        fkCol.push('location_id')
                        pkTable.push(parent.subfeatures[subfeature].featureitem.location)
                        pkCol.push('item_id')
                    } else {
                        fkTable.push(`featureitem_${dependencies.join("_")}_${subfeature}`);
                        fkCol.push('location_id')
                        pkTable.push(`location_${parent.subfeatures[subfeature].featureitem.location}`)
                        pkCol.push('location_id')
                    }
                }
            }
            //subfeature to featureitem foreign key
            fkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`);
            fkCol.push('featureitem_id')
            pkTable.push(`featureitem_${dependencies.join("_")}_${subfeature}`)
            pkCol.push('featureitem_id')

            /////////////
            /// LISTS ///
            /////////////

            //lists and list_m2m for subfeatures
            if('lists' in parent.subfeatures[subfeature]) {
                for(let list of parent.subfeatures[subfeature].lists) {

                    //list_m2m to subfeature foreign key
                    fkTable.push(`list_m2m_${dependencies.join("_")}_${subfeature}_${list}`);
                    fkCol.push('observation_id')
                    pkTable.push(`subfeature_${dependencies.join("_")}_${subfeature}`)
                    pkCol.push('observation_id')
                    //list_m2m to list
                    fkTable.push(`list_m2m_${dependencies.join("_")}_${subfeature}_${list}`);
                    fkCol.push('list_id')
                    pkTable.push(`list_${dependencies.join("_")}_${subfeature}_${list}`)
                    pkCol.push('list_id')

                    // CREATE TABLE list_m2m_...
                    db.none(pgp.as.format(createListM2M.default, {parent: dependencies.join("_") + `_${subfeature}`, list: list}))
                    // CREATE TABLE list_...
                    db.none(pgp.as.format(createList.default, {parent: dependencies.join("_") + `_${subfeature}`, list: list}))
                }
            }

            //making the children subfeatures
            makeSubfeatures(parent.subfeatures[subfeature], [...dependencies, subfeature]) // !recursion
        };
    }
}

//////////////////////////
// database constructor //
//////////////////////////

// Foreign key arrays. Constructed by index
var fkTable = []; 
var fkCol = [];
var pkTable = [];
var pkCol = [];

function constructDB(data) {

    console.log('Creating tables...')

    //making feature tables
    for(let feature in data) {

        ///////////////
        /// FEATURE ///
        ///////////////

        //feature to submission foreign key
        fkTable.push(`feature_${feature}`);
        fkCol.push('submission_id')
        pkTable.push('submission')
        pkCol.push('submission_id')

        //sop_m2m to feature foreign key
        fkTable.push('item_sop_m2m')
        fkCol.push('observation_id')
        pkTable.push(`feature_${feature}`);
        pkCol.push('observation_id')

        //adding data and/or items
        if('additionalCols' in data[feature]) {
            let cols = data[feature]['additionalCols'].join(', ');
            //CREATE TABLE feature_... with additional columns
            db.none(pgp.as.format(createFeature.additional, {feature: feature, additionalCols: cols}))
        } else {
            //CREATE TABLE feature_... with no additional columns
            db.none(pgp.as.format(createFeature.default, {feature: feature}))
        }
        
        ///////////////////
        /// FEATUREITEM ///
        ///////////////////

        //adding featureitem table
        if('featureitem' in data[feature]) {
            //adding data and item cols to featureitem
            if('additionalCols' in data[feature].featureitem) {
                let cols = data[feature].featureitem['additionalCols'].join(', ');
                // CREATE TABLE featureitem_... with additional columns
                db.none(pgp.as.format(createFeatureitem.additional, {featureitem: feature, additionalCols: cols}))
            } else {
                // CREATE TABLE featureitem_... with no additional columns
                db.none(pgp.as.format(createFeatureitem.default, {featureitem: feature}))
            }

            //featureitem to location foreign key
            if('location' in data[feature].featureitem) {
                if(['item_room', 'item_building'].includes(data[feature].featureitem.location)) {
                    fkTable.push(`featureitem_${feature}`);
                    fkCol.push('location_id')
                    pkTable.push(data[feature].featureitem.location)
                    pkCol.push('item_id')
                } else {
                    fkTable.push(`featureitem_${feature}`);
                    fkCol.push('location_id')
                    pkTable.push(`location_${data[feature].featureitem.location}`)
                    pkCol.push('location_id')
                } 
            }
        };

        //feature to featureitem foreign key
        fkTable.push(`feature_${feature}`);
        fkCol.push('featureitem_id')
        pkTable.push(`featureitem_${feature}`)
        pkCol.push('featureitem_id')

        /////////////
        /// LISTS ///
        /////////////

        // adding lists
        if('lists' in data[feature]) {
            for(let list of data[feature].lists) {

                //list_m2m to feature foreign key
                fkTable.push(`list_m2m_${feature}_${list}`);
                fkCol.push('observation_id')
                pkTable.push(`feature_${feature}`)
                pkCol.push('observation_id')
                //list_m2m to list
                fkTable.push(`list_m2m_${feature}_${list}`);
                fkCol.push('list_id')
                pkTable.push(`list_${feature}_${list}`)
                pkCol.push('list_id')

                // CREATE TABLE list_m2m_...
                db.none(pgp.as.format(createListM2M.default, {parent: feature, list: list}))
                // CREATE TABLE list_...
                db.none(pgp.as.format(createList.default, {parent: feature, list: list}))
            }
        }

        //////////////////////////////////////////////
        /// CALLING RECURSIVE SUBFEATURE GENERATOR ///
        //////////////////////////////////////////////

        makeSubfeatures(data[feature], Array(feature))
        
    };
}

// CALLING CONSTRUCTOR FUNCTIONS //

constructDB(schema.wasteAudit); // Change argument to construct a different schema
asyncConstructRelations(2000) // Wait time is somewhat arbitrary, it just has to be long enough for CREATE TABLE queries to resolve first