import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

@Component({
  selector: 'app-upload-audit',
  templateUrl: './upload-audit.component.html',
  styleUrls: ['./upload-audit.component.css']
})
export class UploadAuditComponent implements OnInit {

  isEditable = false;
  buttonText:string = "Select";
  @ViewChild('tabGroup') tabGroup;

  constructor(private router:Router, public dialog: MatDialog) { }

  dataSource = new MatTableDataSource();
  tempData = [
    { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" },
    { auditName: "Bathroom Audit 2", uploadStatus: "uploaded", _id: "5555555555" }
  ]
  displayedColumns: string[] = ['auditName', 'uploadStatus'];

  ngOnInit(): void {
    this.dataSource.data = this.tempData;
  }

  navigate(url) {
    if (!this.isEditable)
      this.router.navigate(url)
  }

  synchronize() {
    // synchronize logic here
    this.isEditable = false; // throwaway
    this.buttonText = "Select"
  }

  delete() {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '35%',
      height: '60%',
      data: false
    })
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        console.log("delete");
        this.isEditable = false; // throwaway
        this.buttonText = "Select";    
      }
      else {
        console.log("don't delete")
      }
    })
    console.log(dialogRef)
  }

  changeEditability(): void {
    this.isEditable = !this.isEditable;
    if (this.isEditable == true) this.buttonText = "Cancel";
    else this.buttonText = "Select";
  }

  isTabDisabled(selectedIndex) {
    if (this.isEditable) {
      if (selectedIndex != this.tabGroup.selectedIndex) {
        return true;
      }
      return false;
    }
    return false;
  }

}
