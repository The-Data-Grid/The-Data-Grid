export interface AppliedFilterSelections {
    numericChoice: any;
    numericEqual: any;
    calendarRange: any;
    calendarEqual: any;
    dropdown: any;
    searchableDropdown: any;
    checklistDropdown: any;
    searchableChecklistDropdown: any;
    text: any;
    bool: any;
    _placeholder?: any;
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