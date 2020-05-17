let sql = {}; //at the end we will put all the variables inside this JS object, but for now just write them all as seperate variable declarations
 



let toiletFilter1 = { 
    type: 'toilet',
    query: 'WHERE $(columns)$(operator)$(value);',
    columns: ['gpf', 'commentary', 'date_conducted'],
    operator: ['=','>=']
};

let somePath1 = { 
    this: 'is just an example'
};

let toiletPath1 = { //all of these are just examples and should be deleted
    type: 'toilet',
    query: 'SELECT $(columns) FROM "audit_toilet";',
    columns: ['gpf', 'commentary', 'date_conducted']
}

let toiletPath = {
    type: 'toilet',
    query: 'SELECT a_t.gpf, a_t.commentary, a_t.date_conducted \
            FROM ("audit_toilet" AS a_t OUTER JOIN "audit_submission" as a_s ON a_s.audit_id = a_t.audit_id \
            OUTER JOIN "loc" as loc ON a_t.location_id = loc.location_id',
    columns: [a_t.gpf, a_t.commentary, a_t.date_conducted]
}





module.exports = sql; //this will export everything to the query engine 