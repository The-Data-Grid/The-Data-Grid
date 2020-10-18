import { Component, OnInit, Input } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Injectable } from '@angular/core';
import { Inject } from '@angular/core';  
import { UploadDialogComponent } from '../upload-dialog/upload-dialog.component';


export interface DialogData {
  name: string;
  size: string;
}

@Component({
  selector: 'app-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['./upload-files.component.css']
})
export class UploadFilesComponent implements OnInit {

  uploadedFiles = 0;
  selectedFiles = [];


  chooseFiles() {
    console.log("hello")
    const realFileButton = (<HTMLInputElement>document.getElementById("files"));
    realFileButton.click();
    var x = document.getElementById("files");
  }

  displayFiles() {
    const realFileButton = (<HTMLInputElement>document.getElementById("files"));
    var x = document.getElementById("files");
    console.log("YES");
    if ('files' in x) {
      for (var i = 0; i < realFileButton.files.length; i++) {
        var file = realFileButton.files[i];
        this.selectedFiles.push({name: file.name, size: file.size});
      }
    }
    for (var j = 0; j <= this.selectedFiles.length - 1; j++) {
      console.log(this.selectedFiles[j]);
    }

    console.log(this.selectedFiles.length);
    this.uploadedFiles = this.selectedFiles.length;
  }
  
  cancel() {
    this.uploadedFiles = 0;
    this.selectedFiles = [];
  }


  constructor(public dialog: MatDialog) { }


  ngOnInit(): void {
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UploadDialogComponent, {
      // width: '300px',
      // height: '400px',
      data: this.selectedFiles,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.uploadedFiles = 0;
      this.selectedFiles = [];
      console.log('The dialog was closed');
    });
  }



}

