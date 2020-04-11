import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { ToiletObject } from '../models'
import { MatDialog, MatDialogConfig } from "@angular/material";
import { DialogComponent } from '../dialog/dialog.component';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

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
  constructor(private apiService: ApiService, private dialog: MatDialog) { }

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.dialog.open(DialogComponent, dialogConfig);
  }

  ngOnInit() {
    /* get api response */
    this.apiService.sendHttps("getAllToiletObjects")
      .subscribe((res) => {
          this.dataSource.data = res;
        });

    /* link sorter to data */
    this.dataSource.sort = this.sort;

     /* link paginator to data */
     setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }
}