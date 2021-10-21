import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { PasswordAuthenticationComponent } from '../password-authentication/password-authentication.component';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { AppComponent } from '../app.component'

export interface PeriodicElement {
  name: string;
  date: string;
  amount: string;
  benefits: string;
  receipt: string;
}
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  isEmailPublic: boolean;
  isQuarterlyUpdates: boolean;
  privilege: string;
  role: string[];
  organizationName: string[];
  organizationID: number[];
}

const ELEMENT_DATA: PeriodicElement[] = [
  {date: "3/12/20", name: 'Project University', amount: "$200.00", benefits: "Tax write-off", receipt: "link"},
  {date: "3/12/20", name: 'Saving the World', amount: "$40.00", benefits: 'Liquidity', receipt: "link"},
  {date: "3/12/20", name: 'Efficiency Epoch', amount: "$4,000.00", benefits: 'Treasury Bonds', receipt: "link"},
];



@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  userData: User;
  rows: any[];
  roleOrg: any[];
  roleType = ['Auditor','Admin']

  constructor(public dialog: MatDialog) { 
    this.fetch_user().then((user) => this.userData = user)
    this.userData = {
      firstName:"Tanya",
      lastName:"Zhong",
      email: "example@email.com",
      dateOfBirth: "01/02/2003",
      isEmailPublic: true,
      isQuarterlyUpdates: true,
      privilege: "privilegeYes",
      role: ["Admin", "EM","Admin"],
      organizationName: ['LA Auditss','Midwestern Auditss','Tri-State Efficiencys'],
      organizationID: [11,21,31]
    }
    this.rows = this.setRows();
    this.roleOrg = this.setRoleOrg();
    this.validForm = false;
  }

  fetch_user(): Promise<User> {
    const url = '/api/user'
    return fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((data) => {
        if (data) 
          return data as User;
      })
   }


  OrganizationColumns = [
    {'prop': "Organization"},
    {'prop': "ID"},
    {'prop': "Role"},

  ]

  
  setRows() {
    let rows = [];
    for (let i = 0; i < this.userData.organizationID.length; i++) {
      rows.push(
          {Organization: this.userData.organizationName[i], ID: this.userData.organizationID[i], Role: this.userData.role[i]}
        );
    }
    return rows;
  }

  setRoleOrg() {
    let roleOrg = [];
    for (let i = 0; i < this.userData.organizationID.length; i++) {
      if (this.userData.role[i] == 'Admin')
        roleOrg.push(this.userData.organizationName[i])
    }
    return roleOrg;
  }

  validForm: boolean;

  async showUpdatedRole() {
    this.validForm = true;
    await new Promise(r => setTimeout(r, 2000));
    this.validForm = false;
  }

  setRole() {
    const url = '/api/user/role';
    let org = (<HTMLInputElement>document.getElementById("selectOrg")).value;
    let i = this.userData.organizationName.indexOf(org);
    const data = {
      organizationID: this.userData.organizationID[i],
      userEmail: this.userData.email,
      role: this.userData.role
    }
    if (data.userEmail.length && data.organizationID && data.role)
      this.showUpdatedRole();
    else
      return;



    return fetch(url, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data) 
      })
      .then((response) => response.json())
      .then((data) => {return data;})
      .catch(error => {return error;});
  }
 
  ngOnInit(): void {
  }

}
