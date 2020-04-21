let toiletResponse = { //Original 6 objects
    "toilets": 
    [
      {
        "objectType": "toilet",
        "gpf": "5",
        "flushometerBrand": "Generic Brand",
        "basinBrand": "Basin Brand",
        "ADAstall": "true",
        "basinConditionID": "12345",
        "flushometerConditionID": "67890",
        "comment": "here is a comment"
      },
      {
        "objectType": "toilet",
        "gpf": "1.2",
        "flushometerBrand": "Best Brand",
        "basinBrand": "Another Basin Brand",
        "ADAstall": "false",
        "basinConditionID": "12",
        "flushometerConditionID": "67",
        "comment": "i love auditing"
      },
        {
        "objectType": "toilet",
        "gpf": "1.2",
        "flushometerBrand": "Best Brand",
        "basinBrand": "Another Basin Brand",
        "ADAstall": "false",
        "basinConditionID": "12",
        "flushometerConditionID": "67",
        "comment": "i love auditing"
      },
        {
        "objectType": "toilet",
        "gpf": "1.2",
        "flushometerBrand": "Best Brand",
        "basinBrand": "Another Basin Brand",
        "ADAstall": "false",
        "basinConditionID": "12",
        "flushometerConditionID": "67",
        "comment": "i love auditing"
      },
        {
        "objectType": "toilet",
        "gpf": "1.2",
        "flushometerBrand": "Best Brand",
        "basinBrand": "Another Basin Brand",
        "ADAstall": "false",
        "basinConditionID": "12",
        "flushometerConditionID": "67",
        "comment": "i love auditing"
      },
        {
        "objectType": "toilet",
        "gpf": "1.2",
        "flushometerBrand": "Best Brand",
        "basinBrand": "Another Basin Brand",
        "ADAstall": "false",
        "basinConditionID": "12",
        "flushometerConditionID": "67",
        "comment": "i love auditing"
      },
        {
        "objectType": "toilet",
        "gpf": "1.2",
        "flushometerBrand": "Best Brand",
        "basinBrand": "Another Basin Brand",
        "ADAstall": "false",
        "basinConditionID": "12",
        "flushometerConditionID": "67",
        "comment": "i love auditing"
      }
    ]
};

function formatDate(date) { //d/m/yyy format
  let d = new Date(date);
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let year = d.getFullYear();
  return [month, day, year].join('/');
};

[].push.apply(toiletResponse.toilets,toiletResponse.toilets); //duplicating
toiletResponse.toilets.pop(); //removing one so we have 12

let impute = (toilet, rows) => {  //random test data
  return toilet.map((toilet,index) => {
    toilet.gpf = rows[index].drat;
    toilet.dateConducted = String(formatDate(new Date(+(new Date()) - Math.floor(Math.random()*50000000000))));
    toilet.ADAstall = String(Math.random() > 0.5 ? "true" : "false");
    toilet.basinConditionID = String(Math.floor(10*Math.random())); 
    toilet.flushometerConditionID = String(Math.floor(10*Math.random()));
    return toilet;
  });
}

module.exports = {
  toiletResponse,
  impute
}

