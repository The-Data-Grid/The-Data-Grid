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
  dataTableColumns = [];
  rows = [];
  tableObject;
  editing = {};

  // variables for filtering sidebar
  filterBy = "Submission";
  setupObject;
  datatypes;
  defaultColumns = [];
  featureDropdownValues = new Map(); //map name to direct children
  selectedFeature;
  appliedFilterSelections = {};
  options: string[] = ['One', 'Two', 'Three'];
  // the following are for multiselect dropdowns
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

  featureSelectors = {};
  globalSelectors = {};

  constructor(private apiService: ApiService, public datepipe: DatePipe) { }

  ngOnInit() {
    this.getSetupTableObject();
  }

  getSetupTableObject() {
    this.apiService.getSetupTableObject().subscribe((res) => {
      this.setupObject = res;
      console.log(res);

      // parse global columns
      this.globalSelectors = this.parseColumn(this.setupObject.globalColumns);

      // parse feature columns
      var i = 0;
      this.setupObject.featureColumns.forEach(featureColumn => {
        if (i < this.setupObject.subfeatureStartIndex) {
          var childFeatures = [];
          // use indicies from directChildren arr to find the corresponsing object
          featureColumn.directChildren.forEach(index => {
            childFeatures.push(this.setupObject.featureColumns[index]);
          });
          // map parent child's name to array of children
          this.featureDropdownValues.set(featureColumn.frontendName, childFeatures);
          i++;
        }
        this.featureSelectors[featureColumn.frontendName] = this.parseColumn(featureColumn.dataColumns);
      });

      // get datatypes array
      this.datatypes = this.setupObject.datatypes;
      // console.log(this.globalSelectors);
      // console.log(this.featureSelectors);
      this.applyFilters();
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
        this.defaultColumns.push(column.columnBackendID);
      }
    });
    return selectors;
  }

  getTableObject() {
    // clear the column headers
    this.dataTableColumns = [];
    this.rows = [];
    var i;

    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      this.tableObject = res;
      // console.log(res);
      // construct the column header arrays
      for (i = 0; i < this.tableObject.columnIndex.length; i++) {
        // globals
        if (this.tableObject.columnIndex[i][0] === null) {
          var idx = this.tableObject.columnIndex[i][1];
          var datatypeIdx = this.setupObject.globalColumns[idx].datatype;

          this.dataTableColumns.push({
            prop: this.setupObject.globalColumns[idx].columnFrontendName,
            type: this.datatypes[datatypeIdx]
          });
        }
        // features
        else {
          var idx1 = this.tableObject.columnIndex[i][0];
          var idx2 = this.tableObject.columnIndex[i][1];
          var datatypeIdx = this.setupObject.featureColumns[idx1].dataColumns[idx2].datatype;

          this.dataTableColumns.push({
            prop: this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName,
            type: this.datatypes[datatypeIdx]
          });;
        }
      }

      //add rows to the table one by one
      this.tableObject.rowData.forEach(element => {
        var row = {};
        row["hyperlinks"] = {};

        // fill out the row object
        for (i = 0; i < this.tableObject.columnIndex.length; i++) {
          // global
          if (this.tableObject.columnIndex[i][0] === null) {
            var idx = this.tableObject.columnIndex[i][1];
            var datatypeIdx = this.setupObject.globalColumns[idx].datatype;

            switch (this.datatypes[datatypeIdx]) {
              case "string": {
                row[this.setupObject.globalColumns[idx].columnFrontendName] = element[i]; break;
              }
              case "hyperlink": {
                row[this.setupObject.globalColumns[idx].columnFrontendName] = element[i].displayString;
                row["hyperlinks"][this.setupObject.globalColumns[idx].columnFrontendName] = element[i].URL; break;
              }
              case "bool": {
                if (element[i]) {
                  console.log(element[i])
                  row[this.setupObject.globalColumns[idx].columnFrontendName] = "True";
                }
                else {
                  row[this.setupObject.globalColumns[idx].columnFrontendName] = "False";
                } break;
              }
            }
          }
          // feature
          else {
            var idx1 = this.tableObject.columnIndex[i][0];
            var idx2 = this.tableObject.columnIndex[i][1];
            var datatypeIdx = this.setupObject.featureColumns[idx1].dataColumns[idx2].datatype;

            switch (this.datatypes[datatypeIdx]) {
              case "string": {
                row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i]; break;
              }
              case "hyperlink": {
                row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i].displayString;
                row["hyperlinks"][this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i].URL; break;
              }
              case "bool": {
                if (element[i]) {
                  console.log(element[i])
                  row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = "True";
                }
                else {
                  row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = "False";
                } break;
              }
            }
          }
        }
        console.log(row);
        this.rows.push(row);
      });
    });
  }

  updateValue(event, cell, rowIndex) {
    console.log('inline editing rowIndex', rowIndex);
    this.editing[rowIndex + '-' + cell] = false;
    this.rows[rowIndex][cell] = event.target.value;
    this.rows = [...this.rows];
    console.log('UPDATED!', this.rows[rowIndex][cell]);
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
    // this.globalColumnsDropdown.forEach(element => {
    //   if (element.selection) {
    //     this.appliedFilterSelections[element.columnObject.queryValue] = element.selection;
    //   }
    // })
    // this.featureColumnsDropdown.forEach(element => {
    //   if (element.selection) {
    //     this.appliedFilterSelections[element.columnObject.queryValue] = element.selection;
    //   }
    // })
    // this.featureColumnsNumericChoice.forEach(element => {
    //   if (element.selection) {
    //     // console.log(element.selection);
    //     this.appliedFilterSelections[element.columnObject.queryValue + '[gte]'] = element.selection;
    //   }
    //   // if input was deleted, remove that property from the appliedFilterSelections object
    //   else if (this.appliedFilterSelections[element.columnObject.queryValue + '[gte]']) {
    //     delete (this.appliedFilterSelections[element.columnObject.queryValue + '[gte]']);
    //   }
    // })

    this.getTableObject();
  }


  applyDateFilter = (val: string) => {
    val = this.datepipe.transform(val, 'MM-dd-yyyy');
    // console.log(val);

    // this.rows = this.filteredData.filter(function (item) {
    //   if (item.dateConducted.toString().toLowerCase().indexOf(val) !== -1 || !val) {
    //     return true;
    //   }
    // });
  }


  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }

}
