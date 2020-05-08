import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
@Component({
  selector: 'app-dialog-component',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css']
})
export class DialogComponent implements OnInit {

  formsFilledOut = false; 

  handleInput() {
    console.log("help");
  }


  checkForms() {
    var user = (<HTMLInputElement>document.getElementById("username")).value;
    var pass = (<HTMLInputElement>document.getElementById("password")).value;

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
    this.dialogRef.updateSize('30%', '85%')
  }



  close() {
    this.dialogRef.close();
  }
}
