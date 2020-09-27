import { Component, OnInit } from '@angular/core';
import { Inject } from '@angular/core';  
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatDialogModule} from '@angular/material/dialog';


interface Data {
  name: string,
  features: Object
  
}

@Component({
  selector: 'app-root-features',
  templateUrl: './root-features.component.html',
  styleUrls: ['./root-features.component.css']
})
export class RootFeaturesComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<RootFeaturesComponent>,
    @Inject(MAT_DIALOG_DATA)public data: Data) {}

  ngOnInit(): void {
  }

  hideOrShow(id) {
    if (document.getElementById(id).style.display != "none") {
      document.getElementById(id).style.display = "none";
    }
    else {
      document.getElementById(id).style.display = "block";
    }

    if (document.getElementById(id + ' caret').classList.contains('right')) {
      document.getElementById(id + ' caret').classList.remove('right');
      document.getElementById(id + ' caret').classList.add('down');
    }

    else {
      document.getElementById(id + ' caret').classList.remove('down');
      document.getElementById(id + ' caret').classList.add('right');
    }

    if (document.getElementById(id + ' separator').classList.contains('separators_highlight')) {
      console.log("removing")
      document.getElementById(id + ' separator').classList.remove('separators_highlight');
    }

    else {
      console.log("adding");
      document.getElementById(id + ' separator').classList.add('separators_highlight');
    }
    
  }

  status = "template";

  close() {
    this.dialogRef.close();
  }

  changeStatus(toggleOption) {
    this.status = toggleOption;
  }


}
