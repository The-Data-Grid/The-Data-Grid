import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { PasswordAuthenticationComponent } from '../password-authentication/password-authentication.component';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {AppComponent} from '../app.component'

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userData: JSON;
  constructor() { 
    const url = '/api/user'
    fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((data) => {
        if (data) 
          this.userData = data;

      })
  }
  rows = [
    {Organization: 'Los Angeles Audits', Privileges: 'Superuser'},
    {Organization: 'Midwestern Audits', Privileges: 'Admin'},
    {Organization: 'Tri-State Efficiency', Privileges: 'User'}
  ];
  email: string;
  ngOnInit(): void {
    this.email = "example"
  }


}
