import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import { Router, UrlHandlingStrategy } from '@angular/router';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

@Component({
  selector: 'app-upload-audit',
  templateUrl: './upload-audit.component.html',
  styleUrls: ['./upload-audit.component.css']
})
export class UploadAuditComponent implements OnInit {


  constructor(private apiService: ApiService,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService, private router: Router, public dialog: MatDialog) {
  }
  isEditable = false;
  buttonText: string = "Select";
  @ViewChild('tabGroup') tabGroup;


  dataSource = new MatTableDataSource();
  displayedColumns = [];
  audits;
  tableRows;
  setupObject;
  dataTableColumns;

  ngOnInit(): void {
    this.getSetupObject();
  }

  getSetupObject() {
    this.apiService.getSetupObject().subscribe((res) => {
      this.setupObject = res;
      this.getAudits();
    });
  }

  getAudits() {
    this.dataTableColumns = [];
    this.apiService.getAudits(this.setupObject).subscribe((res) => {
      this.audits = res;
      this.tableRows = this.tableObjectService.getRows(this.setupObject, this.audits, this.dataTableColumns);
      this.dataSource.data = this.makeTableRows(this.dataTableColumns, this.tableRows)
      this.dataTableColumns.forEach(column => {
        this.displayedColumns.push(column.name)
      });
      // console.log("dataTableColumns", this.dataTableColumns)
      // console.log("tableRows", this.tableRows)
    });
  }

  navigate(auditInfo) {
    if (!this.isEditable) {
      console.log("auditInfo", auditInfo)
      localStorage.setItem('currentlyEditingAuditName', auditInfo['Audit Name']);
      this.router.navigate(['/audit-summary'])
    }
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

  makeTableRows(columns, rows) {
    let allData = [];
    rows.forEach((row) => {
      let rowData = {}

      columns.forEach(column => {
        rowData[column.name] = row[column.returnableID]
      });
      allData.push(rowData)
    });
    return allData;
  }
}



// organizationtree id is 1 1 0 0
//returnable id 157