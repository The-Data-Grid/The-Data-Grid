import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { PasswordAuthenticationComponent } from '../password-authentication/password-authentication.component';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';


// export interface DonationElement {
//   date: string;
//   organization: string;
//   amount: string;
//   benefits: string;
//   receipt: string;
// }

// const ELEMENT_DATA: DonationElement[] = [
//   {date: '10/29/1929', organization:"UCLA",amount:"$42.00",benefits:"liquidity",receipt:"link"},
//   {date: '9/29/2008', organization:"project save the earth",amount:"$500.00",benefits:"CDO",receipt:"link"},
//   {date: '3/12/2020', organization:"Project Launder Money",amount:"$15,000.00",benefits:"Statue",receipt:"link"}

// ]

export interface PeriodicElement {
  name: string;
  date: string;
  amount: string;
  benefits: string;
  receipt: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {date: "3/12/20", name: 'Project University', amount: "$200.00", benefits: "Tax write-off", receipt: "link"},
  {date: "3/12/20", name: 'Saving the World', amount: "$40.00", benefits: 'Liquidity', receipt: "link"},
  {date: "3/12/20", name: 'Efficiency Epoch', amount: "$4,000.00", benefits: 'Treasury Bonds', receipt: "link"},
];



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

  displayedColumns: string[] = ['date', 'name', 'amount', 'benefits', 'receipt'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);

  @ViewChild(MatSort) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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

  GeneralDonationColumns = [
    {'prop': "Date"},
    {'prop': "Project"}
  ]

  FinancialDonationColumns = [
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

  GeneralDonationRows = [
    {Date: "3/08/20", Project: "Project University"},
  ]


  DonationRows = [
    {Date: "3/08/20", Project: "Project University", Amount: "$200.00", Benefits: "Tax write-off", Receipt: "link"},
    {Date: "4/19/20", Project: "Oninit University", Amount: "$450.00", Benefits: "Tax write-off", Receipt: "link"},
    {Date: "5/23/20", Project: "NgAfterInit University", Amount: "$50.00", Benefits: "Gift Certificate", Receipt: "link"},
    {Date: "1/3/21", Project: "NgFor University", Amount: "$100000.00", Benefits: "Statue", Receipt: "link"},

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
