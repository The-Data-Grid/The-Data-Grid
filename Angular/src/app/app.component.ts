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
import {SubmissionObject} from './models/submission'


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
    }, 175);
  }


  constructor(private apiService: ApiService, private dialog: MatDialog, private router: Router, private clipboard: Clipboard,) { }


  checkStorage() {
    // console.log(localStorage)
    if (localStorage.length == 0) {
      return false
    }
    else {
      return true;
    }
  }

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
    // localStorage.removeItem("userEmail");
    this.apiService.signOut()
      .subscribe((res) => {
        localStorage.removeItem("userEmail");
        console.log("signed out!")
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
    this.recheckIfInMenu = false;

    // this.submit();

    // this.dialog.open(LockDialogComponent, dialogConfig);
  }

  copyEmail() {
    this.clipboard.copy("thedatagrid@gmail.com");
  }


  submit() {
    console.log("AYO")
    var submission = {
      "items": {
          "create": [
              {
                  "itemTypeID": 15,
                  "requiredItems": [],
                  "newRequiredItemIndices": [2],
                  "globalPrimaryKey": 1,
                  "newGlobalItemIndex": null,
                  "data": {
                      "returnableIDs": [
                          483,
                          484,
                          485
                      ],
                      "data": [
                          2,
                          "Tesla",
                          "Lockheed Martin"
                      ]
                  }
              },
              {
                  "itemTypeID": 15,
                  "requiredItems": [],
                  "newRequiredItemIndices": [2],
                  "globalPrimaryKey": 1,
                  "newGlobalItemIndex": null,
                  "data": {
                      "returnableIDs": [
                          483,
                          484,
                          485
                      ],
                      "data": [
                          3,
                          "Tesla",
                          "Lockheed Martin"
                      ]
                  }
              },
              {
                  "itemTypeID": 17,
                  "requiredItems": [],
                  "newRequiredItemIndices": [3],
                  "globalPrimaryKey": 1,
                  "newGlobalItemIndex": null,
                  "data": {
                      "returnableIDs": [
                          523,
                          524,
                          525
                      ],
                      "data": [
                          "9001",
                          true,
                          false
                      ]
                  }
              },
              {
                  "itemTypeID": 0,
                  "requiredItems": [{
                      "itemTypeID": 2,
                      "primaryKey": 1
                  }],
                  "newRequiredItemIndices": [],
                  "globalPrimaryKey": 1,
                  "newGlobalItemIndex": null,
                  "data": {
                      "returnableIDs": [
                          142,
                          143
                      ],
                      "data": [
                          "Franz Hall",
                          {"type":"Polygon","coordinates":[[
                              [7.734375,51.835777520452],
                              [3.8671875,48.341646172375],
                              [7.20703125,43.580390855608],
                              [18.6328125,43.834526782237],
                              [17.9296875,50.289339253292],
                              [13.7109375,54.059387886624],
                              [7.734375,51.835777520452]
                          ]]}
                      ]
                  }
              }
          ],
          "update": [],
          "delete": [],
          "requestPermanentDeletion": []
      },
      "observations": {
          "create": [],
          "update": [],
          "delete": []
      }
  }
    this.apiService.submit(submission).subscribe((res) => {
      console.log(res)
    })
  }


}