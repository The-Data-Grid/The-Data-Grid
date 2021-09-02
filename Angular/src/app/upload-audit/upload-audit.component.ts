import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload-audit',
  templateUrl: './upload-audit.component.html',
  styleUrls: ['./upload-audit.component.css']
})
export class UploadAuditComponent implements OnInit {

  isEditable = false;
  buttonText:string = "Select";
  @ViewChild('tabGroup') tabGroup;

  constructor(private router:Router) { }

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
  }

  delete() {
    this.isEditable = false; // throwaway
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
