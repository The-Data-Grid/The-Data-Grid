import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-audit',
  templateUrl: './view-audit.component.html',
  styleUrls: ['./view-audit.component.css']
})
export class ViewAuditComponent implements OnInit {

  constructor() { }

  audit = { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" };
  
  ngOnInit(): void {
  }

}
