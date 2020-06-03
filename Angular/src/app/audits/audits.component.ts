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
  rows = [];
  // columns = [
  //   { name: "GPF", prop: "GPF" },
  //   { name: "Date Submitted", prop: "Date Submitted" },
  //   { name: "Template Name", prop: "Template Name" },
  //   { name: "SOP", prop: "SOP" },
  //   { name: "Commentary", prop: "Commentary" }
  // ];
  columns = [];
  response;
  filteredData = [];
  filterConfig;
  tableConfig;
  globalColumnsDropdown = [];
  globalColumnsCalendarRange = [];


  constructor(private apiService: ApiService, public datepipe: DatePipe) { }
  types = [
    { value: 'water', viewValue: 'Water' },
    { value: 'food_waste', viewValue: 'Food Waste' },
    { value: 'electricity', viewValue: 'Electricity' },
    { value: 'other', viewValue: 'Other' }
  ];
  selectedType = "water";


  ngOnInit() {
    /* get api response */
    this.apiService.getTableConfig().subscribe((res) => {
      // console.log(res);
      this.tableConfig = res;
      this.response = this.tableConfig.columnData;
      this.rows = this.tableConfig.columnData;
      this.filteredData = this.tableConfig.columnData;
      console.log(this.rows);

      //construct the column header array "columns"
      this.tableConfig.columnViewValue.forEach(entry => {
        var col = {
          name: entry,
          prop:entry
        }
        this.columns.push(col);
      })
    });
    console.log(this.columns);

    this.apiService.getFilterConfig().subscribe((res) => {
      // console.log(res);
      this.filterConfig = res;

      this.filterConfig.globalColumns.forEach(globalColumn => {
        if (globalColumn.selector) {
          switch (globalColumn.selector.selectorKey) {
            case "dropdown": {
              this.globalColumnsDropdown.push(globalColumn);
              break;
            }
            case "calendarRange": {
              this.globalColumnsCalendarRange.push(globalColumn);
              break;
            }
          }
        }
      });
    });

    // this.apiService.sendHttps("getAllToiletObjects")
    //   .subscribe((res) => {
    //     console.log(res);
    //     this.response = res;
    //     this.rows = res;
    //     this.filteredData = res;
    //   });

    // console.log(this.apiService.newUrl(["flushometer_brand_name", "time_submitted", "gpf"]));

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