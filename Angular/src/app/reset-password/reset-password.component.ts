import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { HttpHeaders } from "@angular/common/http"
import { first } from 'rxjs/operators';
import { stringify } from '@angular/compiler/src/util';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef } from "@angular/material/dialog";
import { param } from 'jquery';


interface ResetPassObject {
  email: string
  token: string
  password: string
}



@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPassComponent implements OnInit {

  constructor(private route: ActivatedRoute, private apiService: ApiService, private router:Router, private dialog: MatDialog, private toastr: ToastrService, private authService: AuthService) { }

  reset:ResetPassObject;
  isSuccess:boolean;
  encodedEmail: string;
  URLtoken: string;
  passwordsMatch: boolean;
  password;
  signUpPassword;
  matchPassword;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params => {
      console.log(params)
      this.encodedEmail = params.email;
      this.URLtoken = params.token;
    }))
    console.log(this.encodedEmail)
    console.log(this.URLtoken)
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

  resetPassword(){
    this.reset = {
      email: this.encodedEmail,
      token: this.URLtoken,
      password: this.matchPassword
    }

    console.log(this.reset)

    this.apiService.confirmReset(this.reset)
      .subscribe((res) => {
        console.log(res);
        //  this.authService.setSession(res)
         this.toastr.success('Password Reset', '');
         this.router.navigate(['./'])
        return;
        }, (err) => {
          this.router.navigate(['./'])
          this.toastr.error('Invalid password reset link\n Request another to continue', '');
        });  

  }
}
