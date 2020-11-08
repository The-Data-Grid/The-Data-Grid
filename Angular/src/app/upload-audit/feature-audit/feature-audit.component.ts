import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-feature-audit',
  templateUrl: './feature-audit.component.html',
  styleUrls: ['./feature-audit.component.css'],
})
export class FeatureAuditComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<FeatureAuditComponent>) { }

  dummy = [
    {
      title: "Global Data",
      content: []
    },
    {
      title: "Toilet ID",
      content: [
        "Building, Building Name: Mathematical Sciences",
        "Room, Room Number: 1349",
        "Toilet, Clockwise Number: 2"
      ]
    },
    {
      title: "Action",
      content: [
        "Observation",
        "Removal",
        "Permanent Deletion Request"
      ]
    },
    {
      title: "Toilet Attributes",
      content: [
        "Intake Valve*: 32"
      ]
    },
    {
      title: "Toilet Observation",
      content: [
        "Date Conducted:",
        "GPF: 3.14"
      ]
    },
    {
      title: "Subfeature",
      content: [
        "Basin",
        "Flushometer"
      ]
    }
  ]

  featureIndex = 1;

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close();
  }

}
