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
  // columns = [];        DON'T DELETE
  columns = [
    { name: "Building Name", prop: "building_name" },
    { name: "Basin Condition", prop: "basin_condition_name" },
    { name: "Basin Brand", prop: "basin_brand_name" },
    { name: "GPF", prop: "gpf" },
    { name: "Template Name", prop: "template_name" },
  ];
  rows = [];
  filteredData = [];
  defaultColumns = [];
  response;
  tableConfig;

  // variables for filtering sidebar
  filterConfig;
  featureDropdownValues = [];
  globalColumnsDropdown = [];
  globalColumnsCalendarRange = [];
  featureColumnsDropdown = [];
  featureColumnsNumericChoice = [];
  selectedFeature;
  appliedFilterSelections = {};

  selectedBuilding;
  selectedBasin;
  selectedBrand;


  constructor(private apiService: ApiService, public datepipe: DatePipe) { }
  // types = [
  //   { value: 'water', viewValue: 'Water' },
  //   { value: 'food_waste', viewValue: 'Food Waste' },
  //   { value: 'electricity', viewValue: 'Electricity' },
  //   { value: 'other', viewValue: 'Other' }
  // ];
  // selectedType = "water";


  ngOnInit() {
    this.apiService.getFilterConfig().subscribe((res) => {
      // console.log(res);
      this.filterConfig = res;

      // populate the array that holds feature options i.e. toilet, sink
      this.featureDropdownValues = this.filterConfig.featureViewValues;

      //get global filters
      this.filterConfig.globalColumns.forEach(globalColumn => {
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
        if (globalColumn.default) {
          this.defaultColumns.push(globalColumn.queryValue);
        }
      });

      //get feature-specific filters
      this.filterConfig.featureColumns[0].forEach(featureColumn => {
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
      // console.log(this.featureColumnsDropdown);
    });


    // this.apiService.sendHttps("getAllToiletObjects")
    //   .subscribe((res) => {
    //     console.log(res);
    //     this.response = res;
    //     this.rows = res;
    //     this.filteredData = res;
    //   });

  }

  applyFilters() {
    /* get api response */
    if (this.selectedFeature) {
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
        else if (this.appliedFilterSelections[element.columnObject.queryValue + '[gte]']) {
          delete (this.appliedFilterSelections[element.columnObject.queryValue + '[gte]']);
        }
      })
      // console.log(this.appliedFilterSelections);

      this.apiService.getTableConfig(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
        this.tableConfig = res;

        // section for current table response
        this.response = res;
        this.rows = res;
        this.filteredData = res;

        // DON'T DELETE THIS SECTION!!!!!!
        // this.response = this.tableConfig.columnData;
        // this.rows = this.tableConfig.columnData;
        // this.filteredData = this.tableConfig.columnData;

        //construct the column header array "columns" 
        // this.tableConfig.columnViewValue.forEach(element => {
        //   var col = {
        //     name: element,
        //     prop: element
        //   }
        //   this.columns.push(col);
        // })
      });
    }
  }


  filterDatatable(event) {
    // get the value of the key pressed and make it lowercase
    let val = event.target.value.toLowerCase();
    // get the amount of columns in the table
    let colsAmt = this.columns.length;
    // get the key names of each column in the dataset
    let keys = Object.keys(this.response[0]);
    // assign filtered matches to the active datatable
    this.rows = this.filteredData.filter(function (item) {
      // iterate through each row's column data
      for (let i = 0; i < colsAmt; i++) {
        // check for a match
        if (item[keys[i]].toString().toLowerCase().indexOf(val) !== -1 || !val) {
          // found match, return true to add to result set
          return true;
        }
      }
    });
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