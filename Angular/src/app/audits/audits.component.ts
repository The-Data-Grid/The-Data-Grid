import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { ToiletObject } from '../models'
import { MatSort } from '@angular/material/sort'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit {
  dataSource: MatTableDataSource<ToiletObject> = new MatTableDataSource([]);
  types = [
    { value: '0', viewValue: 'Water' },
    { value: '1', viewValue: 'Food Waste' },
    { value: '2', viewValue: 'Electricity' },
    { value: '3', viewValue: 'Other' }
  ];
  displayedColumns = ["GPF",
    "Flushometer Brand",
    "Basin Brand",
    "ADA Stall",
    "Basin Condition ID",
    "Flushometer Condition ID",
    "Comment",
    "Date Conducted"];
  pageSizeOptions = [6, 12, 18]

  // constructor(private apiService: ApiService) {
  constructor(private apiService: ApiService, public datepipe: DatePipe) { }

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngOnInit() {
    /* get api response */
    this.apiService.sendHttps("getAllToiletObjects")
      .subscribe((res) => {
        console.log(res);
        this.dataSource.data = res;
      });

    /* link sorter to data */
    this.dataSource.sort = this.sort;

    /* let sorter know where to find the data to be sorted */
    this.dataSource.sortingDataAccessor = (entry, property) => {
      if (property === 'GPF') {
        return entry.gpf;
      }
      else if (property == 'Flushometer Brand') {
        return entry.flushometerBrand;
      }
      else if (property == 'Basin Brand') {
        return entry.basinBrand;
      }
      else if (property == 'ADA Stall') {
        return entry.ADAstall;
      }
      else if (property == 'Basin Condition ID') {
        return entry.basinConditionID;
      }
      else if (property == 'Flushometer Condition ID') {
        return entry.flushometerConditionID;
      }
      else if (property == 'Comment') {
        return entry.comment;
      }
      else if (property == 'Date Conducted') {
        return entry.dateConducted;
      }
      else {
        return entry[property];
      }
    };

    /* link paginator to data */
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });

    this.dataSource.filterPredicate = (entry, filter) => {
      //var date = new Date(entry.dateConducted);
      // let str = date.toDateString(); 
      var dataStr = entry.gpf + " " + entry.flushometerBrand + " " + entry.basinBrand + " "
        + entry.ADAstall + " " + entry.basinConditionID + " " + entry.flushometerConditionID + " "
        + entry.comment + " " + entry.dateConducted; 
        // new Date(entry.dateConducted);
      dataStr = dataStr.trim().toLocaleLowerCase();
      return dataStr.indexOf(filter) != -1;
    }
  }

  public applyDateFilter = (value: string) => {
    value = this.datepipe.transform(value, 'M/d/yyyy');
    console.log(value);
    this.dataSource.filter = value;
  }

  /* executes filtering upon user input */
  public applyFilter = (value: string) => {
    console.log(value);
    this.dataSource.filter = value;
  }

  public clearFilters() {
    this.dataSource.filter = "";
  }
}