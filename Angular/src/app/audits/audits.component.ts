import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { ToiletObject } from '../models'
import {MatDialog, MatDialogConfig} from "@angular/material";
import { DialogComponent} from '../dialog/dialog.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select'
@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit { 
  toiletObjects;
  displayedColumns = ["GPF", 
  "Flushometer Brand", 
  "Basin Brand", 
  "ADA Stall", 
  "Basin Condition ID", 
  "Flushometer Condition ID", 
  "Comment"];
  constructor(private apiService: ApiService, private dialog: MatDialog) {}

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.dialog.open(DialogComponent, dialogConfig);
  }

  ngOnInit() {
     this.apiService
     .sendHttps("getAllToiletObjects")
     .subscribe(
       (toiletObjects) => {
         this.toiletObjects = toiletObjects;
     }
     );
  }
}