/* audit submission model */
export class AuditSubmission 
{
    timeConducted: number;
    timeSubmitted: number;
    sopID: number;
    userID: number;
    organizationID: number;
}

/* feature models */
export class MirrorObject
{
    objectType: "mirror";
    mirrorConditionID: number;
    comment: string;
}

export class ToiletObject
{
    objectType: "toilet";
    gpf: number;
    flushometerBrand: string;
    basinBrand: string;
    ADAstall: Boolean
    basinConditionID: number;
    flushometerConditionID: number;
    comment: string;

    constructor(values: Object = {}) {
        Object.assign(this, values);
      }
}

export class UrinalObject
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

export class SinkObject
{
    objectType: "sink";
    gpm: number;
    faucetBrand: string;
    conditionID: number;
    faucetConditionID: number;
    basinConditionID: number;
    comment: string;
}