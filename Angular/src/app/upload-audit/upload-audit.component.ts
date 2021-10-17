import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-upload-audit',
  templateUrl: './upload-audit.component.html',
  styleUrls: ['./upload-audit.component.css']
})
export class UploadAuditComponent implements OnInit {

  constructor(private apiService: ApiService) { }

  dataSource = new MatTableDataSource();
  tempData = [
    { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" },
    { auditName: "Bathroom Audit 2", uploadStatus: "uploaded", _id: "5555555555" }
  ]
  displayedColumns: string[] = ['auditName', 'uploadStatus'];
  audits;
  setupObject;

  ngOnInit(): void {
    this.dataSource.data = this.tempData;

    this.apiService.getSetupTableObject().subscribe((res) => {
      this.setupObject = res;
    });

    this.apiService.getAudits().subscribe((res) => {
      this.audits = res;
      console.log("audits", res)
    });
  }
}

// organizationtree id is 1 1 0 0
//returnable id 157