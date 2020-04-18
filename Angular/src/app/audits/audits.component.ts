import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { ToiletObject } from '../models'

import { MatPaginator } from '@angular/material/paginator';
import { MatSort,  } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit {
  dataSource: MatTableDataSource<ToiletObject> = new MatTableDataSource([]);
  displayedColumns = ["GPF",
    "Flushometer Brand",
    "Basin Brand",
    "ADA Stall",
    "Basin Condition ID",
    "Flushometer Condition ID",
    "Comment"];
  pageSizeOptions = [6, 12, 18]
  constructor(private apiService: ApiService) { }

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;



  ngOnInit() {
    /* get api response */
    this.apiService.sendHttps("getAllToiletObjects")
      .subscribe((res) => {
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
      else {
        return entry[property];
      }
    };

    /* link paginator to data */
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }
  /* executes filtering upon user input */
  public applyFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}