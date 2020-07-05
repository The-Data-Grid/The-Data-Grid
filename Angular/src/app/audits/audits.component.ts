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
  columns = [];        //DON'T DELETE

  // the following columns array is for the "old" table object
  // columns = [
  //   { name: "Building Name", prop: "building_name" },
  //   { name: "Basin Condition", prop: "basin_condition_name" },
  //   { name: "Basin Brand", prop: "basin_brand_name" },
  //   { name: "GPF", prop: "gpf" },
  //   { name: "Template Name", prop: "template_name" },
  // ];
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
      // columnObject holds information about the selector
      // selection will hold the user's selection when user interacts with sidebar
      this.setupObject.globalColumns.forEach(globalColumn => {
        if (globalColumn.selector) {
          switch (globalColumn.selector.selectorKey) {
            case "dropdown": {
              this.globalColumnsDropdown.push({ columnObject: globalColumn, selection: null });
              break;
            }
            case "calendarRange": {
              this.globalColumnsCalendarRange.push(globalColumn);
              break;
            }
          }
        }
        // keep track of the default columns denoted by setupObject. 
        // need to use them later to request them from the api
        if (globalColumn.default) {
          this.defaultColumns.push(globalColumn.queryValue);
        }
      });

      //get feature-specific filters
      this.setupObject.featureColumns[0].forEach(featureColumn => {
        if (featureColumn.selector) {
          switch (featureColumn.selector.selectorKey) {
            case "dropdown": {
              this.featureColumnsDropdown.push({ columnObject: featureColumn, selection: null });
              break;
            }
            case "numericChoice": {
              this.featureColumnsNumericChoice.push({ columnObject: featureColumn, selection: null });
              break;
            }
          }
        }
        if (featureColumn.default) {
          this.defaultColumns.push(featureColumn.queryValue);
        }
      });


    });
  }

  getTableObject() {
    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      this.tableObject = res;
      
      //switch to res once backend sends correct object
      var responseString = "{ \"columnViewValue\": [ \"Date Submitted\", \"Template Name\", \"SOP\", \"GPF\", \"commentary\" ], \"columnDatatypeKey\": [ \"string\", \"string\", \"hyperlink\", \"string\", \"string\" ], \"rowData\": [ [ \"2020-01-14\", \"Restroom Audit v1\", { \"displayString\": \"Restroom SOP v1\", \"URL\": \"https:\/\/rat.com\/\" }, \"1.45\", \"smells bad man\" ], [ \"2020-01-15\", \"maintenance2\", { \"displayString\": \"frederick\u2019s SOP 2\", \"URL\": \"https:\/\/agar.io\/\" }, \"6.34\", \"violent flush\" ], [ \"2020-01-16\", \"e2\", { \"displayString\": \"ergo8\", \"URL\": \"https:\/\/facebook.com\/\" }, \"4.35\", \"high centripetal acceleration on flush, streamfunction computation out of bounds\" ] ] }";
      this.tableObject = JSON.parse(responseString);
      console.log(this.tableObject);

      // construct the column header array
      this.tableObject.columnViewValue.forEach(element => {
        this.columns.push( { name: element, prop: element } );
      })

      //add rows to the table one by one
      var row = [];
      var i;

      this.tableObject.rowData.forEach(element => {
        for (i=0;i<this.tableObject.columnDatatypeKey.length;i++) {
          if (this.tableObject.columnDatatypeKey[i] == "string")
            row[this.tableObject.columnViewValue[i]] = element[i];
          else if (this.tableObject.columnDatatypeKey[i] == "hyperlink")
            row[this.tableObject.columnViewValue[i]] = element[i].displayString;
        }
        this.rows.push(row);
      })

      // next three lines work for current (old) table response
      //this.response = res;
      //this.rows = res;
      //this.filteredData = res;
      console.log(res);

      // DON'T DELETE THIS SECTION!!!!!!
      // this.response = this.tableObject.columnData;
      // this.rows = this.tableObject.columnData;
      // this.filteredData = this.tableObject.columnData;

      // construct the column header array
      // this.tableObject.columnViewValue.forEach(element => {
      //   var col = {
      //     name: element,
      //     prop: element
      //   }
      //   this.columns.push(col);
      // })
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