import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';

@Component({
  selector: 'app-upload-audit',
  templateUrl: './upload-audit.component.html',
  styleUrls: ['./upload-audit.component.css']
})
export class UploadAuditComponent implements OnInit {


  constructor(private apiService: ApiService,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) {
  }

  dataSource = new MatTableDataSource();
  tempData = [
    { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" },
    { auditName: "Bathroom Audit 2", uploadStatus: "uploaded", _id: "5555555555" }
  ]
  displayedColumns: string[] = ['auditName', 'uploadStatus'];
  audits;
  tableRows;
  setupObject;
  dataTableColumns;

  ngOnInit(): void {
    this.dataSource.data = this.tempData;
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
      console.log(this.tableRows)
    });
  }
}



// organizationtree id is 1 1 0 0
//returnable id 157