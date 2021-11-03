const queryHelpers = require('../query/queryHelpers.js');
const {
    itemTableNames,
    columnIdTableNameLookup,
    allItems,
    observationItemTableNameLookup,
    columnIdItemLookup,
} = require('../setup.js');

const itemAuthorizationLookup = {};
allItems.forEach(item => {
    itemAuthorizationLookup[item.i__table_name] = {
        queryRole: item.qr__type_name,
        uploadRole: item.ur__type_name,
        queryPrivilege: item.qp__privilege_name,
        uploadPrivilege: item.up__privilege_name,
    };
});

// Database connection and SQL formatter
const {postgresClient} = require('../db/pg.js');
// get connection object
const db = postgresClient.getConnection.db;
const formatSQL = postgresClient.format;

const organizationItemTypeID = Object.entries(itemTableNames).filter(pair => pair[0] === 'item_organization')[1];
const userItemTypeID = Object.entries(itemTableNames).filter(pair => pair[0] === 'item_user')[1];

const validateUploadRecordLookup = {
    item_sop: ['organization_id'],
    item_template: ['organization_id'],
    item_user: ['user_id'],
    item_global: ['user_id', 'organization_id'],
    item_catalog: ['organization_id'],
    item_audit: ['user_id', 'organization_id'],
};

class RequestValidationError extends Error {
    constructor(errObject, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, RequestValidationError)
      }
  
      this.name = 'RequestValidationError'
      // Custom debugging information
      this.code = errObject.code
      this.msg = errObject.msg
    }
}

/**
 * 
 * @param {'query' | 'submission'} queryOrUpload
 */
function authorizationGenerator(queryOrUpload, queryType) {

    return async (req, res, next) => {
        let collectedItems;
        if(queryOrUpload === 'query') {
            // [tableName, ...]
            collectedItems = collectQueryItems(res.locals.parsed, queryType);
        } else {
            // [{
            //    tableName: String,  
            //    itemID: Number | null
            //    userID: Number | null
            //    organizationID: Number | null
            //    globalID: Number | null
            //    isCreate: Boolean
            // }, ...]
            collectedItems = collectSubmissionItems(req.body);
        }
        
        try {
            // throws error if invalid
            await validateItemsOnRequesterRole(collectedItems, res.locals.authorization, queryOrUpload);
            return next();
        } catch(err) {
            console.log(err);
            if(err instanceof RequestValidationError) {
                return res.status(err.code).send(err.msg);
            } else {
                return res.status(500).send(err);
            }  
        }
    }
    
}

/**
 * null values are for guest requests
 * @typedef {Object} authorizationObject
 * @param {String | null} privilege
 * @param {String[]} role
 * @param {Number[]} organizationID Because user can be associated with multiple organizations
 * @param {Number | null} userID
 */

/**
 * 
 * @param {String[]} uniqueItems
 * @param {authorizationObject} authorizationObject
 * @param {'query' | 'submission'} queryOrUpload 
 * @throws {RequestValidationError}
 */
async function validateItemsOnRequesterRole(items, authorizationObject, queryOrUpload) {
    
    // validate every passed item
    for(let itemObjectOrTableName of items) {
        // Check if upload and query is possible based on authorization properties of schemaFeatureInput
        checkRequesterRole(itemObjectOrTableName, authorizationObject, queryOrUpload)

        // Additional upload checks
        if(queryOrUpload === 'upload') {
            // Check if upload is possible based on if reference to organization and user is self
            // optimization to not check same globalID twice
            const alreadyCheckedGlobalIDs = [];
            const newCheckedGlobalID = await validateUploadRecordWithSession(itemObjectOrTableName, authorizationObject, alreadyCheckedGlobalIDs);
            if(newCheckedGlobalID !== null) {
                alreadyCheckedGlobalIDs.push(newCheckedGlobalID);
            }
        }
        
    }

    /**
     * 
     * @param {*} itemTableName 
     * @param {*} authorizationObject 
     * @throws {RequestValidationError}
     */
    function checkRequesterRole(itemTableName, authorizationObject, queryOrUpload) {
        if(queryOrUpload === 'upload') {
            itemTableName = itemTableName.tableName;
        }

        const {
            queryRole,
            uploadRole,
            queryPrivilege,
            uploadPrivilege,
        } = itemAuthorizationLookup[itemTableName];

        // queryRole and queryPrivilege
        if(queryOrUpload === 'query') {
            if(queryPrivilege === 'guest') return;
            if(queryPrivilege === 'superuser') {
                if(authorizationObject.privilege !== 'superuser') {
                    throw new RequestValidationError({code: 403, msg: `Querying table ${itemTableName} is restricted to superusers`});
                } else {
                    return;
                }
            } 
            // then 'user'
            else {
                if(authorizationObject.privilege !== 'user') {
                    throw new RequestValidationError({code: 401, msg: `Querying table ${itemTableName} is restricted to logged in users`});
                } else {
                    if(queryRole === 'auditor') return;
                    if(!authorizationObject.role.includes('admin')) {
                        throw new RequestValidationError({code: 401, msg: `Querying table ${itemTableName} is restricted to users with admin role`});
                    } else {
                        return;
                    }
                }
            }
        } 
        // uploadRole and uploadPrivilege
        else {
            if(uploadPrivilege === 'guest') return;
            if(uploadPrivilege === 'superuser') {
                if(authorizationObject.privilege !== 'superuser') {
                    throw new RequestValidationError({code: 403, msg: `Uploading to table ${itemTableName} is restricted to superusers`});
                } else {
                    return;
                }
            } 
            // then 'user'
            else {
                if(authorizationObject.privilege === 'superuser') {
                    return;
                }
                else if(authorizationObject.privilege !== 'user') {
                    throw new RequestValidationError({code: 401, msg: `Uploading to table ${itemTableName} is restricted to logged in users`});
                } else {
                    if(uploadRole === 'auditor') return;
                    if(!authorizationObject.role.includes('admin')) {
                        throw new RequestValidationError({code: 401, msg: `Uploading to table ${itemTableName} is restricted to users with admin role`});
                    } else {
                        return;
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {Object} itemObject 
     * @param {Object} authorizationObject
     * @param {Number[]} alreadyCheckedGlobalIDs
     * @throws {RequestValidationError}
     */
    async function validateUploadRecordWithSession(itemObject, authorizationObject, alreadyCheckedGlobalIDs) {
        const {
            tableName, 
            itemID,
            userID,
            organizationID,
            globalID,
            isCreate,
        } = itemObject;
        let newCheckedGlobalID = null;
        
        // Escape validation for superuser
        if(authorizationObject.privilege === 'superuser') {
            return newCheckedGlobalID;
        }

        // Check all referenced globals for new items are good
        if(globalID !== null && !alreadyCheckedGlobalIDs.includes(globalID)) {
            let organizationID;
            try {
                const data = await db.one(formatSQL(`
                    SELECT item_user_id, item_organization_id
                    FROM item_global
                    WHERE item_id = $(globalID)
                `, {
                    globalID
                }));

                organizationID = data.item_organization_id;
            } catch(err) {
                console.log(err);
                throw new RequestValidationError({code: 400, msg: `Global item primary key: ${globalID} does not exist`});
            }

            if(!authorizationObject.organizationID.includes(organizationID)) {
                throw new RequestValidationError({code: 401, msg: `Global item primary key: ${globalID} does not belong to requesting user's organization(s)`});
            }
            newCheckedGlobalID = globalID;
        }
        // Only check self for items which must be validated
        if(!(tableName in validateUploadRecordLookup)) {
            return;
        }
        // If creating then check passed organization and user ID directly
        if(isCreate) {
            if(organizationID !== null && !authorizationObject.organizationID.includes(organizationID)) {
                throw new RequestValidationError({code: 401, msg: `Organization ID: ${organizationID} referenced when creating item ${tableName} does not belong to requesting user's organization(s)`});
            }
            if(userID !== null && !authorizationObject.userID !== userID) {
                throw new RequestValidationError({code: 401, msg: `User ID: ${userID} referenced when creating item ${tableName} does not belong to requesting user's organization(s)`});
            }
        } 
        // Otherwise use itemID to query table for IDs and then check
        else {
            for(let IDColumnToValidate of validateUploadRecordLookup[tableName]) {
                const foundID = (await db.one(formatSQL(`
                    SELECT $(IDColumnToValidate) AS id
                    FROM $(tableName)
                    WHERE item_id = $(itemID)
                `, {
                    IDColumnToValidate,
                    tableName,
                    itemID,
                }))).id

                // Organization
                if(IDColumnToValidate === 'item_organization') {
                    if(!authorizationObject.organizationID.includes(foundID)) {
                        throw new RequestValidationError({code: 401, msg: `Item ${tableName} with primary key ${itemID} does not belong to requesting user's organization(s)`});
                    }
                }
                // User
                else {
                    if(authorizationObject.userID !== foundID) {
                        throw new RequestValidationError({code: 401, msg: `Item ${tableName} with primary key ${itemID} does not belong to requesting user`});
                    }
                }
            }
        }
        // return new checked globalIDs
        return newCheckedGlobalID;
    }
}

/**
 * 
 * @param {ReturnableID[]} returnables 
 * @returns {String[]}
 */
function collectQueryItems(parsed, queryType) {
    // get column
    let {
        allReturnableIDs
    } = queryHelpers.makeInternalObjects(parsed, queryType);
    // go through all the returnables and get unique items
    const uniqueItems = [];
    // console.log(allReturnableIDs)
    for(let returnable of allReturnableIDs) {
        let tableName = columnIdItemLookup[returnable.columnID];
        /*
        // if observation table convert to item table
        if(tableName in observationItemTableNameLookup) {
            tableName = observationItemTableNameLookup[tableName];
        }
        */
        if(!uniqueItems.includes(tableName)) {
            uniqueItems.push(tableName);
        }
        
    }
    return uniqueItems;
}

/**
 * 
 * @param {ReturnableID[]} returnables 
 * @returns {{tableName: String, itemID: Number | null, userID: Number | null, organizationID: Number | null, globalID: Number | null, isCreate: Boolean}}
 */
function collectSubmissionItems(submissionObject) {
    const items = [];   
    for(let itemsOrObservations of Object.values(submissionObject)) {
        for(let actionPair of Object.entries(itemsOrObservations)) {
            const isCreate = actionPair[0] === 'create';
            for(let actionObject of actionPair[1]) {
                // userID and organizationID are only checked for 
                // predefined items in validateUploadRecordLookup
                // get userID and organizationID
                let userID = null;
                let organizationID = null;
                // create item or update item
                if('requiredItems' in actionObject || 'nonIDRequiredItems' in actionObject) {
                    let requiredItemsKey = 'nonIDRequiredItems' in actionObject ? 'nonIDRequiredItems' : 'requiredItems';
                    let requiredOrganizations = actionObject[requiredItemsKey].filter(obj => obj.itemTypeID === organizationItemTypeID);
                    if(requiredOrganizations.length > 0) {
                        organizationID = requiredOrganizations[0].primaryKey; 
                    }

                    let requiredUsers = actionObject[requiredItemsKey].filter(obj => obj.itemTypeID === userItemTypeID);
                    if(requiredUsers.length > 0) {
                        userID = requiredUsers[0].primaryKey; 
                    }
                }
                items.push({
                    tableName: itemTableNames[actionObject.itemTypeID],
                    itemID: 'primaryKey' in actionObject ? actionObject.primaryKey : null,
                    globalID: 'globalPrimaryKey' in actionObject ? actionObject.globalPrimaryKey : null,
                    organizationID,
                    userID,
                    isCreate,
                });
            }
        }
    }
    return items;
}

module.exports = {
    authorizeSubmission: authorizationGenerator('upload'),
    authorizeItemQuery: authorizationGenerator('query', 'item'),
    authorizeObservationQuery: authorizationGenerator('query', 'observation')
};