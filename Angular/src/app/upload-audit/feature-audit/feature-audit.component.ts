import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';
import { SetupObjectService } from '../../setup-object.service';
import { SetupObject, TableObject } from '../../responses'
import { environment } from '../../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;


@Component({
  selector: 'app-feature-audit',
  templateUrl: './feature-audit.component.html',
  styleUrls: ['./feature-audit.component.css'],
})
export class FeatureAuditComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<FeatureAuditComponent>,private apiService: ApiService, private setupObjectService: SetupObjectService) { }

  setupObject;
  subfeatures = [];
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

  featureIndex = 0;

  ngOnInit(): void {
    this.getSetupObject();
  }

  close() {
    this.dialogRef.close();
  }

  getSetupObject() {
    this.apiService.getSetupTableObject(null).subscribe((res) => {
      USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;
      let features = this.setupObjectService.getFeaturesToChildren(this.setupObject);
      let subfeatureIndices = features[this.featureIndex];
      for (var i = 0; i < subfeatureIndices.length; i++) {
        this.subfeatures.push(this.setupObject.features[subfeatureIndices[i]].frontendName);
      }
      console.log(this.subfeatures);
    });
  }
  

}
