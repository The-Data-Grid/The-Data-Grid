import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { HttpHeaders } from "@angular/common/http"
import { first } from 'rxjs/operators';
import { stringify } from '@angular/compiler/src/util';
import {Router} from '@angular/router';
import { ToastrService } from 'ngx-toastr';

interface Month {
  value: string;
  viewValue: string;
}

interface loginObject {
  email: string;
  pass: string;
}

interface ForgotPassObject {
  email: string;
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
  resetPassEmail;
  userLoginObject:loginObject;
  signUpObject: SignUpObject;
  forgotPassObject: ForgotPassObject;
  firstname;
  lastname;
  email;
  password;
  month;
  day;
  year;

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

  checkSuccess() {
    //console.log(this.month + "-" + this.day + "-" + this.year);
    //return;
    // this.signUpObject = {
    //   firstName: "Private",
    //   lastName: "Joker",
    //   email: "me@me.com",
    //   pass: "marrone12345",
    //   dateOfBirth: "03-02-1123",
    //   isEmailPublic: true,
    //   isQuarterlyUpdates: true
    // }

    if (this.day < 10) {
      this.day = "0" + stringify(this.day);
    }
    //console.log(this.day);
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
        this.dialogRef.close();
      }

    })

    //this.dialogRef.updateSize('300px','350px')
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

  forgotPassword() {
    this.forgotPassObject = {email:this.resetPassEmail};
    console.log(this.forgotPassObject)
    this.apiService.resetPassword(this.forgotPassObject)
      .subscribe((res) => {
        console.log(res);
        //  this.authService.setSession(res)
         this.toastr.success('Email Sent', '');
        return;
        }, (err) => {
          this.toastr.error('Invalid Credentials', '');
        });
  }

  forgot_password_modal() {
    console.log("forgot password!");
    this.modal = "forgot_password";
  }

  checkEmail() {
    var email = (<HTMLInputElement>document.getElementById("email_attempt")).value;

    if (email.length != 0) {
      this.formsFilledOut = true;
    }
    else {
      this.formsFilledOut = false;
    }
  }


  signIn() {
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

  close() {
    this.dialogRef.close();
  }

}
