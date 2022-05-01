import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { HttpHeaders } from "@angular/common/http"
import { first, isEmpty } from 'rxjs/operators';
import { stringify } from '@angular/compiler/src/util';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { isNullOrUndefined } from '@swimlane/ngx-datatable';

interface Month {
  value: string;
  viewValue: string;
}

interface loginObject {
  email: string;
  pass: string;
}

interface SignUpObject {
  firstName: string;
  lastName: string;
  email: string;
  pass: string;
  dateOfBirth: string;
  isEmailPublic: boolean;
  isQuarterlyUpdates: boolean;
}

@Component({
  selector: 'app-dialog-component',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css']
})
export class DialogComponent implements OnInit {

  modal = "sign_in"
  formsFilledOut = false; 
  loginEmail;
  loginPassword;
  signUpPassword;
  matchPassword;
  userLoginObject:loginObject;
  signUpObject: SignUpObject;
  firstname;
  lastname;
  email;
  password;
  month;
  day;
  year;

  showLoading = false;
  
  handleInput() {
    console.log("help");
  }

  months: Month[] = [
    {value: "01", viewValue: 'January'},
    {value: '02', viewValue: 'February'},
    {value: '03', viewValue: 'March'},
    {value: '04', viewValue: 'April'},
    {value: '05', viewValue: 'May'},
    {value: '06', viewValue: 'June'},
    {value: '07', viewValue: 'July'},
    {value: '08', viewValue: 'August'},
    {value: '09', viewValue: 'September'},
    {value: '10', viewValue: 'October'},
    {value: '11', viewValue: 'November'},
    {value: '12', viewValue: 'December'},

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

  }
  

  constructor(public dialogRef: MatDialogRef<DialogComponent>, private apiService:ApiService, private router:Router, private toastr: ToastrService, private authService: AuthService) { 
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

  // when REGISTER button is clicked
  checkSuccess() {
    this.showLoading = true;

    if (this.authService.isLocalStorageBlocked) {
      this.toastr.error('Your browser is blocking access to local storage. Allow cookies and local storage for www.thedatagrid.org in your browser to continue.')
      this.showLoading = false;
      return;
    }

    // if any of the sign up fields are not filled out, display error
    if (
      isNullOrUndefined(this.firstname) ||
      isNullOrUndefined(this.lastname) ||
      isNullOrUndefined(this.email) ||
      isNullOrUndefined(this.password)
    ) {
      console.log('Requires More Information')
      this.toastr.error('Requires More Information', '');
      this.showLoading = false;
      return;
    }

    if (this.day < 10) {
      this.day = "0" + stringify(this.day);
    }

    this.signUpObject = {
      firstName: this.firstname,
      lastName: this.lastname,
      email: this.email,
      pass: this.password,
      dateOfBirth: this.month + "-" + this.day + "-" + this.year,
      isEmailPublic: true,
      isQuarterlyUpdates: true
    }

    this.apiService.attemptSignUp(this.signUpObject).subscribe((res: any) => {
      console.log("signing up...");
      console.log(res);

      if (res == '') {
        this.router.navigate(['./check-email']);
        this.toastr.success('Sign up Successful', '');
        this.dialogRef.close();
      }
      this.showLoading = false;
    }, (err) => {
      this.showLoading = false;
      this.toastr.error('Invalid Information', '');
    });

    //this.dialogRef.updateSize('300px','350px')
  }

  // not implemented yet
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

  signIn() {
    // Check for localStorage being blocked
    if(this.authService.isLocalStorageBlocked) {
      this.toastr.error('Your browser is blocking access to local storage. Allow cookies and local storage for www.thedatagrid.org in your browser to continue.')
    } else {
      // console.log("email: " + this.loginEmail + ", password: " + this.loginPassword);
      this.userLoginObject = {email:this.loginEmail, pass:this.loginPassword};
      // console.log(this.userLoginObject);
      this.apiService.attemptLogin(this.userLoginObject)
        .subscribe((res) => {
          console.log(res);
           this.authService.setSession(res)
           this.close();
           this.toastr.success('Log in Successful', '');
          return;
          }, (err) => {
            this.toastr.error('Invalid Credentials', '');
          });
    }
  }

  close() {
    this.dialogRef.close();
  }

}
