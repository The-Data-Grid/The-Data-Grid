import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})



export class AuditsComponent implements OnInit {
  // variables for table 
  columns = [];
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
  selectedFeature = 'toilet';
  appliedFilterSelections = {};
  dropdownList = [
    { item_id: 1, item_text: 'Mumbai' },
    { item_id: 2, item_text: 'Bangaluru' },
    { item_id: 3, item_text: 'Pune' },
    { item_id: 4, item_text: 'Navsari' },
    { item_id: 5, item_text: 'New Delhi' }
  ];
  selectedItems = [];
  dropdownSettings:IDropdownSettings = {
    singleSelection: false,
    idField: 'item_id',
    textField: 'item_text',
    enableCheckAll: false,
    // selectAllText: 'Select All',
    // unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    allowSearchFilter: true
  };

  constructor(private apiService: ApiService, public datepipe: DatePipe) { }

  ngOnInit() {
    this.getSetupTableObject();
    this.applyFilters();
  }

  getSetupTableObject() {
    this.apiService.getSetupTableObject().subscribe((res) => {
      this.setupObject = res;

      // populate the array that holds feature options i.e. toilet, sink
      this.featureDropdownValues = this.setupObject.featureViewValues;

      // get global filters. sort them by the type of selector by pushing them into arrays
      // "columnObject" property holds information about the selector
      // "selection" property will hold the user's selection when user interacts with sidebar
      this.setupObject.globalColumns.forEach(column => {
        this.parseSetupObject(column, this.globalColumnsDropdown);
        // keep track of the default columns (denoted by setupObject) to be displayed in the table. 
        // need to use them later to request them from the api
      });

      //get feature-specific filters
      this.setupObject.featureColumns[0].forEach(column => {
        this.parseSetupObject(column, this.featureColumnsDropdown);
      });

      this.setupObject.featureColumnsSearchableDropdown.forEach(column => {
        this.parseSetupObject(column, this.featureColumnsSearchableDropdown);
      });

      this.setupObject.featureColumnsNumericEqual.forEach(column => {
        this.parseSetupObject(column, this.featureColumnsNumericEqual);
      });

      this.setupObject.globalCalenderEqual.forEach(column => {
        this.parseSetupObject(column, this.globalCalenderEqual);
      });

      this.setupObject.featureColumnsSearchableChecklistDropdown(column => {
        this.parseSetupObject(column, this.featureColumnsSearchableChecklistDropdown);
      })

      this.setupObject.featureChecklistDropdown(column => {
        this.parseSetupObject(column, this.featureChecklistDropdown);
      })

    });

  }

  // there are many ways to do this
  // pass in globalcolumns array from the setup object
  // pass in a variable that tells you if its global column or feature column
  parseSetupObject(column, arr) {
    if (column.selector) {
      switch (column.selector.selectorKey) {
        case "dropdown": {
          arr.push({ columnObject: column, selection: null });
          break;
        }
        case "calendarRange": {
          arr.push({ columnObject: column, selection: null });
          break;
        }
        case "numericChoice": {
          arr.push({ columnObject: column, selection: null });
          break;
    }
        case "searchableDropdown": {
          arr.push({ columnObject: column, selection: null});
          break;
        }
        case "calendarEqual": {
          arr.push({ columnObject: column, selection: null });
          break;
        }
        case "searchableChecklistDropdown": {
          arr.push({ columnObject: column, selection: null });
          break;
        }
        case "checklistDropdown": {
          arr.push({ columnObject: column, selection: null });
        }
      }
    }
    if (column.default) {
      this.defaultColumns.push(column.queryValue);
    }

}
 
  getTableObject() {
    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      this.tableObject = res;
      var i;

      // construct the column header array
      for (i = 0; i < this.tableObject.columnDatatypeKey.length; i++) {
        if (this.tableObject.columnDatatypeKey[i] === "string") {
          this.columns.push({prop: this.tableObject.columnViewValue[i]});
        }
        else if (this.tableObject.columnDatatypeKey[i] === "hyperlink") {
          this.hyperlinkColumns.push({prop: this.tableObject.columnViewValue[i]});
        }
      }

      //add rows to the table one by one
      this.tableObject.rowData.forEach(element => {
        var row = {};
        for (i = 0; i < this.tableObject.columnDatatypeKey.length; i++) {
          if (this.tableObject.columnDatatypeKey[i] == "string")
            row[this.tableObject.columnViewValue[i]] = element[i];
          else if (this.tableObject.columnDatatypeKey[i] == "hyperlink") {
            row[this.tableObject.columnViewValue[i]] = element[i].displayString;
            row["link"] = element[i].URL;
          }
        }
        this.rows.push(row);
      })

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
