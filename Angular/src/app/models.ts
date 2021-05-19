export interface AppliedFilterSelections {
    numericChoice: any;
    numericEqual: any;
    calendarRange: any;
    calendarEqual: any;
    dropdown: any;
    searchableDropdown: Array<multiselectOption[]>;  // array of multiselectoptions arrays
    checklistDropdown: Array<multiselectOption[]>; 
    searchableChecklistDropdown: Array<multiselectOption[]>; 
    text: any;
    bool: any;
    _placeholder?: any;
}

export interface ReturnableIDObject {
    all: number[];
    default: number[];
}

export interface multiselectOption { 
    item_id: number;
    item_text: String;
}

// export interface Selectors  {
//     numericChoice: any[],
//     numericEqual: any[],
//     calendarRange: any[],
//     calendarEqual: any[],
//     dropdown: any[],
//     searchableDropdown: any[],
//     checklistDropdown: any[],
//     searchableChecklistDropdown: any[],
//     text: any[],
//     bool: any[],
//     _placeholder?: any
//   };








///////no longer up to date:///////////////////
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