////// QUERY ENGINE //////

// pg-promise sql formatter
const {postgresClient} = require('./db/pg.js');
const formatSQL = postgresClient.format;

// alias join and submission SQL statements
const {
    submission,
    referenceSelectionJoin
} = require('./statement.js').query

/**  
  * dynamicSQLEngine
  * 
  * Calls:
  *     recursiveReferenceSelection
  *     string2Join
  *     formatSelectAlias
  * 
  * @param {Array} returnableIDs
  * @param {Array} featureTreeArray
  * @param {String} feature
  * @returns {Object} {selectClauseArray, joinClauseArray, featureTreeArray, whereLookup}
  */

var dynamicSQLEngine = (returnableIDs, featureTreeArray, feature) => {
    // Initialize Output
    let selectClauseArray = [];
    let joinClauseArray = [];
    let whereLookup = {};

    // push the item_submission reference
    joinClauseArray.push(formatSQL(submission, {
        feature: feature
    }));
    
    // Handle returnables that do not have references
    let localReturnables = returnableIDs.filter(returnable => returnable.joinObject.refs.length == 0);
    localReturnables.forEach(returnable => {

        // push feature to featureTree if not a submission returnable
        if(returnable.feature !== null) {
            featureTreeArray.push(returnable.feature);
        };

        // if no sql needs to appended
        if(returnable.appendSQL === null) {
            /*  
                1. add select clause and no join, since select references either 
                item_submission or observation_..., which are joined by default'
            */
            selectClauseArray.push(formatSelectAlias(returnable.selectSQL, returnable.ID));

            /*
                2. add table.column clause to whereLookup
            */
            whereLookup[returnable.ID] = returnable.selectSQL;

        } else { // then SQL needs to be appended
            /*
                appendSQL should not have any parameters since it is joined to either the feature
                or the submission, and not a request specific alias. 

                1. add select clause
            */
            selectClauseArray.push(formatSelectAlias(returnable.selectSQL, returnable.ID));

            //  2. add join clause (from appendSQL)
            joinClauseArray.push(returnable.appendSQL);

            //  3. add table.column clause to whereLookup
            whereLookup[returnable.ID] = returnable.selectSQL;
        };
    });

    // Handle returnables with references
    let referencedReturnables = returnableIDs.filter(returnable => returnable.joinObject.refs.length != 0)

    // get all join objects for reference selection
    let joinObjects = referencedReturnables.map(returnable => returnable.joinObject);

    // perform reference selection to trim join tree and assign aliases
    // @call recursiveReferenceSelection
    let joinSelectionObject = recursiveReferenceSelection([joinObjects], {}, 1)

    let builtArray = joinSelectionObject.builtArray;
    let idAliasLookup = joinSelectionObject.idAliasLookup;

    // Convert join strings into valid SQL with assigned alias
    builtArray.forEach(join => {
        joinClauseArray.push(string2Join(join, 'a'))
    });

    referencedReturnables.forEach(returnable => {

        // push feature to featureTree if not a submission returnable
        if(returnable.feature !== null) {
            featureTreeArray.push(returnable.feature);
        };
        
        // get alias from rRS output
        let alias = 'a' + idAliasLookup[returnable.ID.toString()];

        // if appendSQL get alias from idAliasLookup and interpolate into appendSQL. Then add select and where based on known value
        if(returnable.appendSQL !== null) {

            // interpolate and push
            let append = formatSQL(returnable.appendSQL, {
                alias: alias
            });

            joinClauseArray.push(append)

            // add select
            selectClauseArray.push(formatSelectAlias(returnable.selectSQL, returnable.ID));

            // add table.column clause to whereLookup
            whereLookup[returnable.ID] = returnable.selectSQL;

        } else { // then no appendSQL and alias must be interpolated into select and where clauses

            // interpolate join alias into select
            let select = formatSQL(returnable.selectSQL, {
                alias: alias
            });

            // add select
            selectClauseArray.push(formatSelectAlias(select, returnable.ID));

            // add table.column clause to whereLookup
            whereLookup[returnable.ID] = select;
        };
    });

    return({
        selectClauseArray,
        joinClauseArray,
        featureTreeArray,
        whereLookup
    });


    // HELPER FUNCTIONS //


    /** 
     * Trims unneeded joins, generates and assigns aliases to returnables
     * 
     * for set of joinObjects with the same parent
     *    compare 1st element of refs
     *     create a new set of unique refs and generate aliases
     *     create the subset of the next refArray for that parent with parent, aliases, and refs
     *     create the subset of the next joinObject for that parent with parent=alias, id=id, and ref=ref[-1]
     *     if (refs.length == 0)
     *         append to idAliasLookup id=id, alias=alias and don't append to joinObject
     * replace the last element of builtArray with the union of nextRefArray
     * if (nextJoinObject.length == 0)
     *     return
     *     append the union of nextJoinObject subsets to builtArray
     * 
     * @param {Array} builtArray 
     * @param {Object} idAliasLookup 
     * @param {Number} aliasNumber 
     * 
     * @returns {Object} {builtArray, idAliasLookup}
     */
    function recursiveReferenceSelection(builtArray, idAliasLookup, aliasNumber) {
        'use strict';
        //console.log('join object:', builtArray)

        // get depth
        let depth = builtArray.length

        // get joinObject - Need to deep copy all the ref arrays to prevent mutation
        let joinObjectArray = [];
        builtArray[depth - 1].forEach(obj => {
            joinObjectArray.push({
                parentAlias: obj.parentAlias,
                ID: obj.ID,
                refs: Array.from(obj.refs) // as to not mutate returnableIDLookup
            })
        })

        // partition joinObject based on parent
            // get parents
            let joinObjectArrayParents = joinObjectArray.map(element => element.parentAlias)
            // get unqiue parents
            let uniqueJoinObjectArrayParents = [...new Set(joinObjectArrayParents)]
            // create object of unique parents
            let joinObjectArrayPartition = {}
            uniqueJoinObjectArrayParents.forEach(parent => {
                joinObjectArrayPartition[parent] = []
            })
            // add joinObjects to respective parents in unique parents object
            for(let obj of joinObjectArray) {
                joinObjectArrayPartition[obj.parentAlias].push(obj)
            }
        // create nextRefArray and nextJoinObjectArray
        let nextRefArray = []
        let nextJoinObjectArray = []
        // for parent partition of joinObjects
        //console.log(joinObjectArrayPartition)
        for(let parent in joinObjectArrayPartition) {
            //console.log(parent)
            // get unqiue references
            let uniqueRefs = [...new Set(joinObjectArrayPartition[parent].map(joinObject => joinObject.refs[0]))]
            // generate aliases for refs
            let uniqueAliases = uniqueRefs.map(() => aliasNumber++)
            // create nextRefArray for partion and add to nextRefArray
            let partitionNextRefArray = uniqueRefs.map((ref, i) => [parseInt(parent), uniqueAliases[i], ref])
            //console.log(partitionNextRefArray)
            partitionNextRefArray.forEach(refArray => {
                nextRefArray.push(refArray)
            })
            // create next joinObject or add to idAliasLookup if done
            joinObjectArrayPartition[parent].forEach(joinObject => {
                // remove last ref
                let parentAlias = joinObject.refs.splice(0, 1)[0]
                //console.log(parentAlias)
                //console.log(uniqueRefs.indexOf(parentAlias))
                // get alias for last ref
                //console.log(uniqueAliases)
                parentAlias = uniqueAliases[uniqueRefs.indexOf(parentAlias)]
                //console.log(parentAlias)
                // if no more refs
                if(joinObject.refs.length == 0) {
                    idAliasLookup[joinObject.ID] = parentAlias
                } else { // more refs
                    nextJoinObjectArray.push({
                        parentAlias: parentAlias,
                        ID: joinObject.ID,
                        refs: joinObject.refs
                    })
                }
            }) 
        }
        // replace the last element of builtArray with the union of refArray partitions
        builtArray[depth - 1] = nextRefArray
        // if the selection is complete
        if (nextJoinObjectArray.length == 0) {
            // flatten builtArray
            let output = [];
            builtArray.forEach(arr => {
                arr.forEach(arr => {
                    output.push(arr)
                })
            })
            // return and finish
            return({
                builtArray: output,
                idAliasLookup: idAliasLookup
            })
        } else { // then there are more joins
            console.log('rRS recurse')
            // append the next joinObjectArray to builtArray
            builtArray.push(nextJoinObjectArray)
            // recursively call the function
            return recursiveReferenceSelection(builtArray, idAliasLookup, aliasNumber)
        }
    };

    /**
     * Converts rRS array with aliases into a valid SQL join clause
     * 
     * @param {Array} string named poorly!
     * @param {String} prefix should be one character
     * 
     * @returns {String} valid SQL join clause
     */
    function string2Join(string, prefix) {
        let clauseArray = [];
        // string[0] = parent alias number
        //       [1] = self alias number
        //       [2] = join string itself
    
        // 0: originalTable, 1: originalColumn, 2: joinTable, 3: joinColumn
        string[2].split('>').forEach(el => {
            clauseArray.push(el.split('.')[0])
            clauseArray.push(el.split('.')[1])
        })

        // if parentAlias is the root feature join to the feature rather than an alias
        let originalAlias;
        (string[0] === -1 ? originalAlias = clauseArray[2] : originalAlias = prefix + string[0])

        let joinAlias = prefix + string[1]
        return(formatSQL(referenceSelectionJoin, {
            joinTable: clauseArray[0],
            joinAlias: joinAlias,
            joinColumn: clauseArray[1],
            originalAlias: originalAlias,
            originalColumn: clauseArray[3]
        }))

    };

    /** SELECT clause alias assignment helper */ 
    function formatSelectAlias(select, id) {
        return `${select} AS r${id.toString()}`
    };

};


// Export the engine
module.exports = dynamicSQLEngine;