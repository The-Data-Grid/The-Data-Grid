import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogComponent } from './login-dialog/login-dialog.component';
import { LockDialogComponent } from './lock-dialog/lock-dialog.component';
import {MatMenuTrigger} from '@angular/material/menu'

const API_URL = environment.apiUrl;
const PORT = environment.port;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  title = 'THE DATA GRID';

  constructor(private apiService: ApiService, private dialog: MatDialog) { }

  check() {
    console.log("lala");
  }


  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.dialog.open(DialogComponent, dialogConfig);
  }

  openMenu() {
    console.log("SUCCESS!")
  }


  ngOnInit() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.dialog.open(LockDialogComponent, dialogConfig);
  }
}