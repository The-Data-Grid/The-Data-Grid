import { Component, OnInit } from '@angular/core';
import { Inject } from '@angular/core';  
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

interface DialogData {
  name: string;
  size: string;
}

@Component({
  selector: 'app-lock-dialog',
  templateUrl: './lock-dialog.component.html',
  styleUrls: ['./lock-dialog.component.css']
})
export class LockDialogComponent implements OnInit {
  fail;
  pass;
  formsFilledOut = false; 

  handleInput() {
    if (this.pass == "powerSource2020") {
      this.fail = false;
      this.close();
    }
    else
      this.fail = true;
  }


  checkForms() {
    this.pass = (<HTMLInputElement>document.getElementById("password_attempt")).value;

    if (this.pass.length!=0) {
      this.formsFilledOut = true;
    }
    else {
      this.formsFilledOut = false;
    }

    console.log(this.formsFilledOut);
  }

  constructor(public dialogRef: MatDialogRef<LockDialogComponent>) { 
  }

  ngOnInit() {
    this.fail = false;
    this.dialogRef.updateSize('30%', '85%')
  }



  close() {
    this.dialogRef.close();
  }
}