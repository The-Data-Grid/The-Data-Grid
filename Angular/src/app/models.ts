/* audit submission model */
export class auditSubmission 
{
    timeConducted: number;
    timeSubmitted: number;
    sopID: number;
    userID: number;
    organizationID: number;
}

/* feature models */
export class mirrorObject
{
    objectType: "mirror";
    mirrorConditionID: number;
    comment: string;
}

export class toiletObject
{
    objectType: "toilet";
    gpf: number;
    flushometerBrand: string;
    basinBrand: string;
    ADAstall: Boolean
    basinConditionID: number;
    flushometerConditionID: number;
    comment: string;
}

export class urinalObject
{
    objectType: "urinal";
    gpf: number;
    flushometerBrand: string;
    basinBrand: string;
    conditionID: number;
    basinConditionID: number;
    flushometerConditionID: number;
    comment: string;
}

export class sinkObject
{
    objectType: "sink";
    gpm: number;
    faucetBrand: string;
    conditionID: number;
    faucetConditionID: number;
    basinConditionID: number;
    comment: string;
}