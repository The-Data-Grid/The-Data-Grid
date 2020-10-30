import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { PasswordAuthenticationComponent } from '../password-authentication/password-authentication.component';


@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit {

  constructor(public dialog: MatDialog) { 
    this.fetch(data => {
      this.rows = data;
    });

  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/mock.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }


  OrganizationColumns = [
    {'prop': "Organization"},
    {'prop': "Privileges"},
    {'prop': "Members"},

  ]

  DonationColumns = [
    {'prop': "Date"},
    {'prop': "Project"},
    {'prop': "Amount"},
    {'prop': "Benefits"},
    {'prop': "Receipt"},
  ]


  // hyperlinkColumns = [
  //   {'prop': "Tax Receipt"}
  // ]


  isAvatarHover = false;
  LAAuditsMembers = ["Antonio Gramsci", "Thomas Pynchon"]
  MidwestMembers = ["Robert James Fischer", "Paul Charles Morphy", "Judit Pulgar"]
  TriStateMembers = ["Louisa May Alcott", "Orson Welles"]

  rows = [
    {Organization: 'Los Angeles Audits', Privileges: 'Superuser', Members: this.LAAuditsMembers.join(",  ") },
    {Organization: 'Midwestern Audits', Privileges: 'Admin', Members: this.MidwestMembers.join(",  ")},
    {Organization: 'Tri-State Efficiency', Privileges: 'User', Members: this.TriStateMembers.join(",  ")}
  ];


  DonationRows = [
    {Date: "3/08/20", Project: "Project University", Amount: "$200.00", Benefits: "Tax write-off", Receipt: "link"}

  ]

  hoverOnAvatar() {
    this.isAvatarHover = !this.isAvatarHover;
  }

  hoverOnEditButton() {
    console.log("oof")
    // this.isAvatarHover = true;
  }

  ngOnInit(): void {
    (<HTMLInputElement>document.getElementById("email_input")).value = "default_email123@gmail.com";
    (<HTMLInputElement>document.getElementById("password_input")).value = "password12345";
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(PasswordAuthenticationComponent, {
      // width: '300px',
      // height: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }


}
