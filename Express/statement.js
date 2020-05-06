let sql = {}; //at the end we will put all the variables inside this JS object, but for now just write them all as seperate variable declarations
 



let toiletFilter1 = { //make the names refer to what the filter is instead of like this
    query: 'WHERE $(columns)$(operator)$(value);',
    columns: ['gpf', 'commentary', 'date_conducted'],
    operator: ['=','>=']
};

let somePath1 = { //both of these are just examples and should be deleted
    this: 'is just an example'
};








module.exports = sql; //this will export everything to the query engine 