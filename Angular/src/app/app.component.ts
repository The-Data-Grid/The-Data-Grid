import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogComponent } from './login-dialog/login-dialog.component';
import { LockDialogComponent } from './lock-dialog/lock-dialog.component';
import {MatMenuTrigger} from '@angular/material/menu'
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard'


const API_URL = environment.apiUrl;
const PORT = environment.port;

interface logoutObject {
  email: string;
  pass: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  title = 'THE DATA GRID';
  currentWindowWidth;
  isHover:boolean = false;


  constructor(private apiService: ApiService, private dialog: MatDialog, private router: Router, private toastr:ToastrService, private clipboard: Clipboard) { }


  checkStorage() {
    // console.log(localStorage)
    if (localStorage.length == 0) {
      return false
    }
    else {
      return true;
    }
  }


  changeHover() {
    this.isHover = !this.isHover;
  }

  logOut() {
    console.log(localStorage)
    localStorage.removeItem("userEmail");
    this.apiService.signOut()
      .subscribe((res) => {
        localStorage.removeItem("userEmail");
        console.log("signed out!")
        this.toastr.info('Signed Out Successfully', '', {
          positionClass: 'toast-bottom-center', 
          timeOut: 3000,
        })
      })
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

  copyEmail() {
    this.clipboard.copy("thedatagrid@gmail.com");
  }
}