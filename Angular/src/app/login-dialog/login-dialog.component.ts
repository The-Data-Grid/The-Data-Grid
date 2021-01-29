import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";

interface Month {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-dialog-component',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css']
})
export class DialogComponent implements OnInit {

  modal = "sign_in"
  formsFilledOut = false; 
  signUpPassword;
  matchPassword;

  handleInput() {
    console.log("help");
  }

  months: Month[] = [
    {value: 'jan', viewValue: 'January'},
    {value: 'feb', viewValue: 'February'},
    {value: 'mar', viewValue: 'March'},
    {value: 'apr', viewValue: 'April'},
    {value: 'may', viewValue: 'May'},
    {value: 'jun', viewValue: 'June'},
    {value: 'jul', viewValue: 'July'},
    {value: 'aug', viewValue: 'August'},
    {value: 'sep', viewValue: 'September'},
    {value: 'oct', viewValue: 'October'},
    {value: 'nov', viewValue: 'November'},
    {value: 'dec', viewValue: 'December'},

  ];


  checkForms() {
    var user = (<HTMLInputElement>document.getElementById("username_attempt")).value;
    var pass = (<HTMLInputElement>document.getElementById("password_attempt")).value;

    if (user.length != 0 && pass.length!=0) {
      this.formsFilledOut = true;
    }
    else {
      this.formsFilledOut = false;
    }

    console.log(this.formsFilledOut);

  }
  

  constructor(public dialogRef: MatDialogRef<DialogComponent>) { 
  }

  ngOnInit() {
    this.dialogRef.updateSize('400px', '550px')
  }

  sign_up_modal() {
    console.log("signing up!");
    this.modal = "sign_up";
  }

  sign_in_modal() {
    console.log("back to login page")
    this.modal = "sign_in";
  }

  checkSuccess() {
    this.modal = "success";
    this.dialogRef.updateSize('300px','350px')
  }

  passwords_match() {
    var password = (<HTMLInputElement>document.getElementById("password_1")).value;
    var confirm_password = (<HTMLInputElement>document.getElementById("password_2")).value;

    if (password != "" && confirm_password != "" && password != confirm_password) {
      return false;
    }
    return true;
  }

  isPasswordAttempted() {
    let password = (<HTMLInputElement>document.getElementById("password_1")).value;
    let confirm = (<HTMLInputElement>document.getElementById("password_2")).value;
    if (password != "" || confirm != "") {
      return false;
    }
    return true;
  }

  shouldDisplayWarning() {
    var regExp = /[a-zA-Z]/g;
    var numRegExp = /[0-9]/g;
    if (this.signUpPassword) {
      console.log(this.signUpPassword.length)
      if (this.signUpPassword.length > 0) {
        if (!regExp.test(this.signUpPassword) || !numRegExp.test(this.signUpPassword) || this.signUpPassword.length < 10) {
          return false;
        }
        else {
          return true;
        }
      }
      return true;
    }
    return true;
    // if (this.signUpPassword.length > 0) {
    //   return false;
    // }
    // return true;
  }

  checkSignupPasswords() {
  }

  checkPasswords() {
    if (this.signUpPassword && this.matchPassword) {
      if (this.signUpPassword === this.matchPassword) {
        return true;
      }
      else {
        return false;
      }  
    }
    return true;
  }

  canConfirmPassword() {
    if (this.signUpPassword || this.matchPassword) {
      if ((this.signUpPassword.length > 1 && this.shouldDisplayWarning()) || this.matchPassword) {
        return true;
      }
      return false;
    }
    return false;
  }

  close() {
    this.dialogRef.close();
  }
}
