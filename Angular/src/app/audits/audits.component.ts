import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
// import {SwimlaneColumn} from '../models'
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
  globalColumnsDropdown = [];
  globalColumnsCalendarRange = [];
  featureColumnsDropdown = [];
  featureColumnsNumericChoice = [];
  selectedFeature = 'toilet';
  appliedFilterSelections = {};
  datatypes = new Map();

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
        if (column.selector) {
          switch (column.selector.selectorKey) {
            case "dropdown": {
              this.globalColumnsDropdown.push({ columnObject: column, selection: null });
              break;
            }
            case "calendarRange": {
              this.globalColumnsCalendarRange.push({ columnObject: column, selection: null });
              break;
            }
          }
        }
        // keep track of the default columns (denoted by setupObject) to be displayed in the table. 
        // need to use them later to request them from the api
        if (column.default) {
          this.defaultColumns.push(column.queryValue);
        }
      });

      //get feature-specific filters
      this.setupObject.featureColumns[0].forEach(column => {
        if (column.selector) {
          switch (column.selector.selectorKey) {
            case "dropdown": {
              this.featureColumnsDropdown.push({ columnObject: column, selection: null });
              break;
            }
            case "numericChoice": {
              this.featureColumnsNumericChoice.push({ columnObject: column, selection: null });
              break;
            }
          }
        }
        if (column.default) {
          this.defaultColumns.push(column.queryValue);
        }
      });
    });
  }

  // there are many ways to do this
  // pass in globalcolumns array from the setup object
  // pass in a variable that tells you if its global column or feature column
  parseSetupObject() {

  }

  getTableObject() {
    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      this.tableObject = res;

      //switch to res once backend sends correct object
      var responseString = "{ \"columnViewValue\": [ \"Date Submitted\", \"Template Name\", \"SOP\", \"GPF\", \"commentary\" ], \"columnDatatypeKey\": [ \"string\", \"string\", \"hyperlink\", \"string\", \"string\" ], \"rowData\": [ [ \"2020-01-14\", \"Restroom Audit v1\", { \"displayString\": \"Restroom SOP v1\", \"URL\": \"https:\/\/rat.com\/\" }, \"1.45\", \"smells bad man\" ], [ \"2020-01-15\", \"maintenance2\", { \"displayString\": \"frederick\u2019s SOP 2\", \"URL\": \"https:\/\/agar.io\/\" }, \"6.34\", \"violent flush\" ], [ \"2020-01-16\", \"e2\", { \"displayString\": \"ergo8\", \"URL\": \"https:\/\/facebook.com\/\" }, \"4.35\", \"high centripetal acceleration on flush, streamfunction computation out of bounds\" ] ] }";
      this.tableObject = JSON.parse(responseString);
      console.log(this.tableObject);

      var i;

      // construct the column header array
      // this.tableObject.columnViewValue.forEach(element => {
      //   this.columns.push( { name: element, prop: element } );
      // })
      for (i = 0; i < this.tableObject.columnDatatypeKey.length; i++) {
        if (this.tableObject.columnDatatypeKey[i] === "string") {
          this.columns.push({
            name: this.tableObject.columnViewValue[i],
            prop: this.tableObject.columnViewValue[i]
          });
        }
        else if (this.tableObject.columnDatatypeKey[i] === "hyperlink") {
          this.hyperlinkColumns.push({
            name: this.tableObject.columnViewValue[i],
            prop: this.tableObject.columnViewValue[i]
          });
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

}