/* audit submission model */
export class AuditSubmission {
    timeConducted: number;
    timeSubmitted: number;
    sopID: number;
    userID: number;
    organizationID: number;
}

/* feature models */
export class MirrorObject {
    objectType: "mirror";
    mirrorConditionID: number;
    comment: string;
}

export class ToiletObject {
    objectType: "toilet";
    gpf: number;
    flushometerBrand: string;
    basinBrand: string;
    ADAstall: Boolean
    basinConditionID: number;
    flushometerConditionID: number;
    comment: string;
    dateConducted: string;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}

export class UrinalObject {
    objectType: "urinal";
    gpf: number;
    flushometerBrand: string;
    basinBrand: string;
    conditionID: number;
    basinConditionID: number;
    flushometerConditionID: number;
    comment: string;
}

export class SinkObject {
    objectType: "sink";
    gpm: number;
    faucetBrand: string;
    conditionID: number;
    faucetConditionID: number;
    basinConditionID: number;
    comment: string;
}


export class SetupTableObject {
    globalSelectors: FilterSelector[];
    featureFilters: {
        Sink: FilterSelector[];
        Toilet: FilterSelector[];
        featureColumns: {
            Sink: DataColumn[];
            Toilet: DataColumn[];
        };
    };
}

export class TableObject {
    columnViewValue: string[];
    columnDataTypeKey: string[];
    columnData: any[];
}


export class DataColumn {
    columnQueryValue: string;
    columnViewValue: string;
    default: Boolean;

}

export class FilterSelector {
    type: string;
    filterQueryValue: string;
    filterViewValue: string
    values: string[] 
    validation: string[] 

}