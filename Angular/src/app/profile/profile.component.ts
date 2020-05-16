import { Component, OnInit, ElementRef } from '@angular/core';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  constructor(private elementRef:ElementRef) { }

  email = "default_email@gmail.com (Edit me!)";
  user_name = "default_username (Edit me!)";
  organization = "UCLA BHS (Edit me!)";
  password = "password123";
  passwordHide(text) {
    if (text.length != 0) {
      return ("*".repeat(text.length));
    }
    else {
      return ' ';
    }
}

  changes = false;
  isEdit = false;


  ngAfterViewChecked() {
    var s = document.createElement("script");
    s.type = "text";
    (<HTMLInputElement>document.getElementById("username_input")).value = this.user_name;
    (<HTMLInputElement>document.getElementById("email_input")).value = this.email;
    (<HTMLInputElement>document.getElementById("organization_input")).value = this.organization;
    (<HTMLInputElement>document.getElementById("password_input")).value = this.passwordHide(this.password);


    (<HTMLInputElement>document.getElementById("username_input_edit")).value = this.user_name;
    (<HTMLInputElement>document.getElementById("email_input_edit")).value = this.email;
    (<HTMLInputElement>document.getElementById("organization_input_edit")).value = this.organization;
    (<HTMLInputElement>document.getElementById("password_input_edit")).value = this.passwordHide(this.password);


    this.elementRef.nativeElement.appendChild(s);



    // (<HTMLInputElement>document.getElementById("username_input")).value = this.user_name;
    // (<HTMLInputElement>document.getElementById("username_input_edit")).value = this.user_name;


    // //s.src = "http://somedomain.com/somescript";
    // this.elementRef.nativeElement.appendChild(s);
  }


  editIsActive() {
    this.isEdit = true;
  }

  profileIsActive() {
    this.isEdit = false;
    this.changes = false;
  }


  changeInformation() {
    if (this.changes) {
      var new_username = (<HTMLInputElement>document.getElementById("username_input_edit")).value;
      this.user_name = new_username;
      var new_email = (<HTMLInputElement>document.getElementById("email_input_edit")).value;
      this.email = new_email;
      var new_organization = (<HTMLInputElement>document.getElementById("organization_input_edit")).value;
      this.organization = new_organization;
      var new_password = (<HTMLInputElement>document.getElementById("password_input_edit")).value;
      this.password = new_password;
      this.isEdit = false;
      this.changes = false;
    }
    else {
      return;
    }
  }

  formsChanged() {
    var new_username = (<HTMLInputElement>document.getElementById("username_input_edit")).value;
    var new_email = (<HTMLInputElement>document.getElementById("email_input_edit")).value;
    var new_organization = (<HTMLInputElement>document.getElementById("organization_input_edit")).value;
    var new_password = (<HTMLInputElement>document.getElementById("password_input_edit")).value;

    if (new_username != this.user_name || new_email != this.email || new_organization != this.organization || new_password != this.password) {
      this.changes = true;
      // console.log("changes ahappening")
    }


    else {
      this.changes = false;
    }

  }

  getFormStatus() {
    return this.changes;
  }


  ngOnInit(): void {

  }

}
