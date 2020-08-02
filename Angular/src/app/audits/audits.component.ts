import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

// export interface SelectorTypeObject {
//   numericChoice: [];
//   numericEqual: [];
//   calendarRange: [];
//   calendarEqual: [];
//   dropdown: [];
//   searchableDropdown: [];
//   checklistDropdown: [];
//   searchableChecklistDropdown: [];
//   text: [];
//   bool: [];
// }


export class AuditsComponent implements OnInit {
  // variables for table 
  dataTableColumns = [];
  hyperlinkColumns = [];
  rows = [];
  filteredData = [];
  response;
  tableObject;

  // variables for filtering sidebar
  setupObject;
  defaultColumns = [];
  featureDropdownValues = [];
  // global = {
  //   dropdown: []
  // }
  globalColumnsDropdown = [];
  globalColumnsCalendarRange = [];
  globalCalenderEqual = [];
  featureColumnsSearchableChecklistDropdown = [];
  featureSearchableChecklistDropdown = [];
  featureColumnsDropdown = [];
  featureColumnsSearchableDropdown = [];
  featureColumnsNumericChoice = [];
  featureColumnsNumericEqual = [];
  featureChecklistDropdown = [];
  selectedFeature = 'Toilet';
  appliedFilterSelections = {};
  dropdownList = [
    { item_id: 1, item_text: 'Mumbai' },
    { item_id: 2, item_text: 'Bangaluru' },
    { item_id: 3, item_text: 'Pune' },
    { item_id: 4, item_text: 'Navsari' },
    { item_id: 5, item_text: 'New Delhi' }
  ];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'item_id',
    textField: 'item_text',
    enableCheckAll: false,
    // selectAllText: 'Select All',
    // unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    allowSearchFilter: true
  };

  // todo: figure out how to do this with types
  featureSelectors = {};
  globalSelectors = {};

  constructor(private apiService: ApiService, public datepipe: DatePipe) { }

  ngOnInit() {
    this.getSetupTableObject();
    this.applyFilters();
  }

  getSetupTableObject() {
    this.apiService.getSetupTableObject().subscribe((res) => {
      this.setupObject = res;

      // parse global columns
      this.globalSelectors = this.parseColumn(this.setupObject.globalColumns);

      // parse feature columns
      this.setupObject.featureColumns.forEach(featureColumn => {
        this.featureDropdownValues.push(featureColumn.frontendName);
        this.featureSelectors[featureColumn.frontendName] = this.parseColumn(featureColumn.dataColumns);
      });
      console.log(this.globalSelectors);
      console.log(this.featureSelectors);
    });

  }

  parseColumn(columns): any {
    let selectors = {
      numericChoice: [],
      numericEqual: [],
      calendarRange: [],
      calendarEqual: [],
      dropdown: [],
      searchableDropdown: [],
      checklistDropdown: [],
      searchableChecklistDropdown: [],
      text: [],
      bool: []
    };

    columns.forEach(column => {
      if (column.filterSelector) {
        switch (column.filterSelector.selectorKey) {
          case "dropdown": { selectors.dropdown.push(column); break; }
          case "numericChoice": { selectors.numericChoice.push(column); break; }
          case "numericEqual": { selectors.numericEqual.push(column); break; }
          case "calendarRange": { selectors.calendarRange.push(column); break; }
          case "calendarEqual": { selectors.calendarEqual.push(column); break; }
          case "searchableDropdown": { selectors.searchableDropdown.push(column); break; }
          case "checklistDropdown": { selectors.checklistDropdown.push(column); break; }
          case "searchableChecklistDropdown": { selectors.searchableChecklistDropdown.push(column); break; }
          case "text": { selectors.text.push(column); break; }
          case "bool": { selectors.bool.push(column); break; }
        }
      }
      if (column.default) {
        this.defaultColumns.push(column.queryValue);
      }
    });

    return selectors;
  }

  getTableObject() {
    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      this.tableObject = res;
      // console.log(res);
      var i;

      // construct the column header array
    //   for (i = 0; i < this.tableObject.columnDatatypeKey.length; i++) {
    //     if (this.tableObject.columnDatatypeKey[i] === "string") {
    //       this.dataTableColumns.push({ prop: this.tableObject.columnViewValue[i] });
    //     }
    //     else if (this.tableObject.columnDatatypeKey[i] === "hyperlink") {
    //       this.hyperlinkColumns.push({ prop: this.tableObject.columnViewValue[i] });
    //     }
    //   }

    //   //add rows to the table one by one
    //   this.tableObject.rowData.forEach(element => {
    //     var row = {};
    //     row["hyperlinks"] = {};
    //     for (i = 0; i < this.tableObject.columnDatatypeKey.length; i++) {
    //       if (this.tableObject.columnDatatypeKey[i] == "string")
    //         row[this.tableObject.columnViewValue[i]] = element[i];
    //       else if (this.tableObject.columnDatatypeKey[i] == "hyperlink") {
    //         row[this.tableObject.columnViewValue[i]] = element[i].displayString;
    //         row["hyperlinks"][this.tableObject.columnViewValue[i]] = element[i].URL;
    //         console.log(row);
    //       }
    //     }
    //     this.rows.push(row);
    //   })

    });
  }


  // filterDatatable(event) {
  //   // get the value of the key pressed and make it lowercase
  //   let val = event.target.value.toLowerCase();
  //   // get the amount of columns in the table
  //   let colsAmt = this.columns.length;
  //   // get the key names of each column in the dataset
  //   let keys = Object.keys(this.response[0]);
  //   // assign filtered matches to the active datatable
  //   this.rows = this.filteredData.filter(function (item) {
  //     // iterate through each row's column data
  //     for (let i = 0; i < colsAmt; i++) {
  //       // check for a match
  //       if (item[keys[i]].toString().toLowerCase().indexOf(val) !== -1 || !val) {
  //         // found match, return true to add to result set
  //         return true;
  //       }
  //     }
  //   });
  // }

  applyFilters() {
    /* get api response */
    if (!this.selectedFeature) {
      return;
    }
    // check if any selections were made
    this.globalColumnsDropdown.forEach(element => {
      if (element.selection) {
        this.appliedFilterSelections[element.columnObject.queryValue] = element.selection;
      }
    })
    this.featureColumnsDropdown.forEach(element => {
      if (element.selection) {
        this.appliedFilterSelections[element.columnObject.queryValue] = element.selection;
      }
    })
    this.featureColumnsNumericChoice.forEach(element => {
      if (element.selection) {
        console.log(element.selection);
        this.appliedFilterSelections[element.columnObject.queryValue + '[gte]'] = element.selection;
      }
      // if input was deleted, remove that property from the appliedFilterSelections object
      else if (this.appliedFilterSelections[element.columnObject.queryValue + '[gte]']) {
        delete (this.appliedFilterSelections[element.columnObject.queryValue + '[gte]']);
      }
    })


    this.getTableObject();
  }


  applyDateFilter = (val: string) => {
    val = this.datepipe.transform(val, 'MM-dd-yyyy');
    // console.log(val);

    this.rows = this.filteredData.filter(function (item) {
      if (item.dateConducted.toString().toLowerCase().indexOf(val) !== -1 || !val) {
        return true;
      }
    });
  }


  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }

}
