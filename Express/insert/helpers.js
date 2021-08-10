/**
 * Insertion helper functions
 */

/**
 * Composes a many to many table insertion function
 * @param {Boolean} isObservation 
 */
function insertManyToManyGenerator(isObservation) {
    let foreignKeyColumnName = 'item_id';
    if(isObservation) {
        foreignKeyColumnName = 'observation_id';
    }
    /**
     * Insert item_id|observation_id and list_id into a m2m table
     * @param {Number} primaryKeyOfInsertedValue 
     * @param {Number} primaryKey 
     * @param {String} listTableName 
     * @param {Object} db 
     */
    return async (primaryKeyOfInsertedValue, primaryKey, listTableName, db) => {
        const manyToManyTableName = 'm2m_' + listTableName;
        if(type(primaryKeyOfInsertedValue) !== 'array') {
            primaryKeyOfInsertedValue = [primaryKeyOfInsertedValue];
        }
        for(let key of primaryKeyOfInsertedValue) {
            try {
                await db.none(formatSQL(`INSERT INTO $(manyToManyTableName:name) 
                    (list_id, $(foreignKeyColumnName:name))
                    VALUES
                    ($(primaryKeyOfInsertedValue), $(primaryKey))
                `, {
                    manyToManyTableName,
                    primaryKeyOfInsertedValue: key,
                    primaryKey,
                    foreignKeyColumnName
                }));        
            } catch(err) {
                throw new CreateItemError({code: 500, msg: `Error when inserting key ${key} and ${primaryKey} into ${manyToManyTableName}`});
            }
        }
    };
}

/**
 * Composes an external column insertion function for inserting
 * values into list, attribute, factor, or location tables
 * @param {String} primaryKeyColumnName 
 * @param {Boolean} isMutable 
 * @param {String} referenceType 
 * @param {Object} db 
 */
function externalColumnInsertGenerator(primaryKeyColumnName, isMutable, referenceType, db) {
    /**
     * @param {String} tableName 
     * @param {String} columnName 
     * @param {String|Number|Date|Object|Boolean|Array} data 
     * @returns {<{columnName: String, primaryKey: Number | Array.<Number>}>}
     * // Array of values if list reference type
     */
    return async (tableName, columnName, data) => {
        let primaryKey;
        const foreignKeyColumnName = tableName + '_id';
        // List Handling
        if(referenceType === 'item-list' || referenceType === 'obs-list') {
            // check to see if all values are valid
            try {
                primaryKey = await db.many(formatSQL(`
                    select list_id
                    from $(tableName:name)
                    WHERE $(columnName:name) = ANY ($(data:array))
                `, {
                    tableName,
                    columnName,
                    data,
                }));
                
            } catch(err) {
                throw new CreateItemError({code: 500, msg: `Error when getting current list values from ${tableName}`});
            }
            // if there are new values
            if(primaryKey.length != data.length) {
                const newValues = data.length.filter(value => !primaryKey.includes(value));
                if(!isMutable) {
                    throw new CreateItemError({code: 400, msg: `Value(s) ${newValues} from list input ${data.length} are not valid for the column ${columnName} and table ${tableName}`})
                } else {
                    // insert new values
                    let newPrimaryKeys = [];
                    try {
                        for(let value of newValues) {
                            // Now insert
                            const newKey = (await db.one(formatSQL(`
                                INSERT INTO $(tableName:name) 
                                    ($(columnName:name))
                                    VALUES
                                    ($(value))
                                        RETURNING $(primaryKeyColumnName:name)
                            `, {
                                tableName,
                                columnName,
                                value,
                                primaryKeyColumnName
                            })))[primaryKeyColumnName];
                            newPrimaryKeys.push(newKey);
                        }
                        primaryKey = [...primaryKey, ...newPrimaryKeys];
                    } catch(err) {
                        throw new CreateItemError({code: 500, msg: `Error when inserting ${newValues} into ${tableName}`})
                    }
                }
            }
        // Factor, Attribute, Location handling
        } 
        else if(referenceType == 'item-location' || referenceType == 'obs-location') {
            // Now insert
            try {
                primaryKey = (await db.one(formatSQL(`
                    INSERT INTO $(tableName:name) 
                        ($(columnName:name))
                        VALUES
                        (ST_GeomFromGeoJSON($(data)))
                            RETURNING $(primaryKeyColumnName:name)
                `, {
                    tableName,
                    columnName,
                    data,
                    primaryKeyColumnName
                })))[primaryKeyColumnName];
            } catch(err) {
                throw new CreateItemError({code: 500, msg: 'Server error when inserting foreign key into the item or observation column'})
            }

            return {
                // Foreign key column name and value inside the item_... table
                columnName: foreignKeyColumnName,
                columnValue: primaryKey
            };
            
        } else {
            let dataValue = formatSQL('$(data)', {
                data
            });
            try {
                // note db.many here, we are deciding not to throw
                // if more than one record is returned with the
                // value. This is to prevent upload from breaking
                // if duplicates are found in list, attribute, location,
                // or factor tables
                primaryKey = (await db.many(formatSQL(`
                    SELECT $(primaryKeyColumnName:name)
                    FROM $(tableName:name)
                    WHERE $(columnName:name) = $(dataValue:raw)
                `, {
                    tableName,
                    columnName,
                    dataValue,
                    primaryKeyColumnName
                })))[0][primaryKeyColumnName];

            } catch(err) {
                if(!isMutable) {
                    const validValues = (await db.any(formatSQL(`
                        SELECT $(columnName:name)::json
                        FROM $(tableName:name)
                    `, {
                        tableName,
                        columnName
                    }))).map(v => v[columnName]).join(', ');
                    throw new CreateItemError({code: 400, msg: `The value ${data} is not one of the valid values (${validValues}) for ${tableName}`});
                }

                // Now insert
                try {
                    primaryKey = (await db.one(formatSQL(`
                        INSERT INTO $(tableName:name) 
                            ($(columnName:name))
                            VALUES
                            ($(data))
                                RETURNING $(primaryKeyColumnName:name)
                    `, {
                        tableName,
                        columnName,
                        data,
                        primaryKeyColumnName
                    })))[primaryKeyColumnName];
                } catch(err) {
                    throw new CreateItemError({code: 500, msg: 'Server error when inserting foreign key into the item or observation column'})
                }
            }
                
        }
        return {
            // Foreign key column name and value inside the item or observation table
            columnName: foreignKeyColumnName,
            columnValue: primaryKey
        };
    };
}



module.exports = {
    insertItemManyToMany: insertManyToManyGenerator(false),
    insertObservationManyToMany: insertManyToManyGenerator(true),
    externalColumnInsertGenerator
};