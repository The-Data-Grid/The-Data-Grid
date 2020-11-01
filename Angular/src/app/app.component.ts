import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogComponent } from './login-dialog/login-dialog.component';
import { LockDialogComponent } from './lock-dialog/lock-dialog.component';
import {MatMenuTrigger} from '@angular/material/menu'
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

const API_URL = environment.apiUrl;
const PORT = environment.port;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  title = 'THE DATA GRID';
  currentWindowWidth;
  isHover:boolean = false;


  constructor(private apiService: ApiService, private dialog: MatDialog, private router: Router,) { }

  check() {
    console.log("lala");
  }


  changeHover() {
    this.isHover = !this.isHover;
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


  @HostListener('window:resize')
  onResize() {
    this.currentWindowWidth = window.innerWidth;
  }


  ngOnInit() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "600px";
    dialogConfig.height = "700px";
    this.currentWindowWidth = window.innerWidth;

    // this.dialog.open(LockDialogComponent, dialogConfig);
  }
}