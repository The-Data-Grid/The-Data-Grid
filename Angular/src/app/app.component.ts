import { Component, OnInit, ViewChild, HostListener, ViewChildren, QueryList } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogComponent } from './login-dialog/login-dialog.component';
import { LockDialogComponent } from './lock-dialog/lock-dialog.component';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu'
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard'
import { black } from 'chalk';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';

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

  style = true

  // for the dropdowns
  @ViewChildren(MatMenuTrigger) trigger: QueryList<MatMenuTrigger>;

  currentWindowWidth;
  recheckIfInMenu: boolean;
  recheckIfInMenu2: boolean;
  recheckIfInMenu3:boolean;

  openResourceMenu(index:number) {
    this.trigger.toArray()[index].openMenu();
  }

  closeResourceMenu(index:number) {
    setTimeout(() => {
      if (index == 1) {
        if (this.recheckIfInMenu2 == false) {
          this.trigger.toArray()[index].closeMenu();
        }
      }

      else if (index == 0) {
        if (this.recheckIfInMenu === false) {
          this.trigger.toArray()[index].closeMenu();
        }  

      }
      else {
        if (this.recheckIfInMenu3 === false) {
          this.trigger.toArray()[index].closeMenu();
        }  
      }
    }, 225);
  }


  constructor(
    private apiService: ApiService, 
    private dialog: MatDialog, 
    private router: Router, 
    private clipboard: Clipboard,
    private toastr: ToastrService,
    public authService: AuthService
  ) { }

  // mat-nav bars aren't really designed for dropdowns, so customizing dropdown styles is a bit convoluted. Each index in the dropdownsHovered
  // array corresponds to a dropdown button (eg 0 index corresponds to mission, 1 to How It Works, etc)

  dropdownsHovered:Array<boolean> = [false,false,false,false,false,false,false,false];

  adjustDropdownHover(index:number) {
    this.dropdownsHovered[index] = !this.dropdownsHovered[index];
  } 

  isActiveButton(url:any, index:number) {
    if (this.router.url === url || this.dropdownsHovered[index]) {
      return '#F0F0F0';
    }
    else {
      return 'transparent';
    }
  }

  @HostListener('window:scroll', [])
  scrollHandler() {
      for (let index = 0; index < this.trigger.toArray().length; index++) {
    this.trigger.toArray()[index].closeMenu();
      }
  }

  // getHeight() {
  //   return window.scrollY
  //   return `${window.scrollY} px`;
  //   console.log(window.scrollY);
  // }


  logOut() {
    if(this.authService.isLocalStorageBlocked) {
      this.toastr.error('Your browser is blocking access to local storage. Allow cookies and local storage for www.thedatagrid.org in your browser to continue.')
    } else {
      this.apiService.signOut()
        .subscribe((res) => {
          this.authService.clearSessionData();
          this.toastr.info('Signed out', '');
          this.router.navigateByUrl('/');
        }, (err) => {
          this.authService.clearSessionData();
          this.toastr.info('Your login session expired')
        })
    }
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
    this.recheckIfInMenu = false;
  }

  copyEmail() {
    this.clipboard.copy("thedatagrid@gmail.com");
  }
}