import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { ToiletObject } from '../models'
// import { MatSort } from '@angular/material/sort'
// import { MatPaginator } from '@angular/material/paginator'
// import { MatTableDataSource } from '@angular/material/table'
import { DatePipe } from '@angular/common';
// import { DatatableComponent } from '../../../../src/lib/components/datatable.component';
// import { ColumnMode } from 'projects/swimlane/ngx-datatable/src/public-api';
// import { DatatableComponent } from '../../../@swimlane/ngx-datatable/lib/components/datatable.component';
// import { DatatableComponent } from '../../../../node_modules/@swimlane/ngx-datatable/lib/components/datatable.component';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit {
  rows = [];
  columns = [
    { name: "GPF", width: "80" },
    { name: "Flushometer Brand" },
    { name: "Basin Brand" },
    { prop: "ADAstall", name: "ADA Stall" },
    { prop: "basinConditionID", name: "Basin Condition ID" },
    { prop: "flushometerConditionID", name: "Flushometer Condition ID", width: "200" },
    { name: "Comment" },
    { name: "Date Conducted" }
  ];
  response;
  filteredData = [];
  filterConfig;
  globalColumns = [];

  constructor(private apiService: ApiService, public datepipe: DatePipe) { }
  types = [
    { value: 'water', viewValue: 'Water' },
    { value: 'food_waste', viewValue: 'Food Waste' },
    { value: 'electricity', viewValue: 'Electricity' },
    { value: 'other', viewValue: 'Other' }
  ];
  selectedType = "water";
  displayedColumns = ["GPF",
    "Flushometer Brand",
    "Basin Brand",
    "ADA Stall",
    "Basin Condition ID",
    "Flushometer Condition ID",
    "Comment",
    "Date Conducted"
  ];

  ngOnInit() {
    /* get api response */
    this.apiService.getFilterConfig().subscribe((res) => {
      console.log(res);
      this.filterConfig = res;

      this.filterConfig.globalColumns.forEach(globalColumn => {
           this.stagedData.push(seeker.doc);
       });
    });

    this.apiService.sendHttps("getAllToiletObjects")
      .subscribe((res) => {
        this.response = res;
        this.rows = res;
        this.filteredData = res;
      });

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
    console.log(val);

    this.rows = this.filteredData.filter(function (item) {
      if (item.dateConducted.toString().toLowerCase().indexOf(val) !== -1 || !val) {
        return true;
      }
    });
  }

}