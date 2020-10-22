import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RootFeaturesComponent } from '../root-features/root-features.component';
import { GlobalPresetsComponent} from '../global-presets/global-presets.component';
import { FeatureAuditComponent} from '../feature-audit/feature-audit.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-view-audit',
  templateUrl: './view-audit.component.html',
  styleUrls: ['./view-audit.component.css'],
  providers: [DatePipe]
})
export class ViewAuditComponent implements OnInit {

  myDate = new Date();
  columns = ["Action","Last Updated","Room ID","Clockwise Number"]

  getProp(col) {
    return col.replace(/\s+/g, '_');
  }


  constructor(public dialog: MatDialog, private datePipe: DatePipe) {
   }

  audit = { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" };

  audits = [
    {name:"Restroom Audit", included: true, features: [{name: "Toilet", included: true, actions:[{Action: "Removal", Last_Updated: "5 mins ago", Room_ID: "1201B", Clockwise_Number: 8}, {Action: "Creation", Last_Updated: "3 days ago", Room_ID:"1201B", Clockwise_Number: 4}, {Action: "Observation", Last_Updated: "3 days ago", Room_ID:"1201B", Clockwise_Number: 5}]}, {name: "Sink", included: true, actions:[{Action: "Deletion Request", Last_Updated: "45 mins ago", Room_ID: "1201B", Clockwise_Number: 3}, {Action: "Creation and Observation", Last_Updated: "4 months ago", Room_ID: "1201B", Clockwise_Number: 7}]}, {name: "Urinal", included: true, actions:[{Action: "Creation", Last_Updated: "1 hr ago", Room_ID: "1201B", Clockwise_Number: 2}, {Action: "Observation", Last_Updated: "1 hr ago", Room_ID: "1201B", Clockwise_Number: 1}]}]},
    {name: "Irrigation Audit", included: true, features: [{name: "Sprinkler", included: true, actions:[{Action: "Creation", Last_Updated: "12 mins ago", Room_ID: "23A", Clockwise_Number: 2}, {Action:"Observation", Last_Updated: "33 mins ago", Room_ID:"23A", Clockwise_Number:4}]}, {name: "Canal", included: true, actions:[{Action: "Creation and Observation", Last_Updated: "3 weeks ago", Room_ID: "23A", Clockwise_Number: 13}]}, {name: "Sewer", included: true, actions:[{Action: "Deletion Request", Last_Updated: "3 weeks ago", Room_ID: "23A", Clockwise_Number: 9}, {Action: "Observation and Creation", Last_Updated: "3 weeks ago", Room_ID: "23A", Clockwise_Number: 3}]}]},
    {name: "Boiler Room Audit", included: true, features: [{name: "Boiler", included: true, actions:[{Action: "Removal", Last_Updated: "1 year ago", Room_ID: "11C", Clockwise_Number: 22},{Action: "Creation", Last_Updated: "12 years ago", Room_ID: "11C", Clockwise_Number: 16}]}, {name: "Pump", included: true, actions:[{Action: "Deletion Request", Last_Updated: "3 years ago", Room_ID: "12B", Clockwise_Number: 9}, {Action:"Creation", Last_Updated:"65 years ago", Room_ID:"12B", Clockwise_Number: 7}]}]}
  ]


  openRootFeatures(): void {
    const dialogRef = this.dialog.open(RootFeaturesComponent, {
      width: '801px',
      height: '500px',
      data: this.audits
    })
  }

  openGlobalPresets(): void {
    const dialogRef = this.dialog.open(GlobalPresetsComponent, {
      panelClass: 'audit-dialog-no-padding',
      width: '801px',
      height: '500px',
      data: this.audits
    })
  }

  showOrHideTable(feature) {
    console.log(feature);
    const tableElement = document.getElementById(feature)
    if (tableElement.style.display == 'none') {
      document.getElementById(feature).style.display = "inline-table"
      document.getElementById(feature + ' caret').classList.remove("fa-caret-down");
      document.getElementById(feature + ' caret').classList.add('fa-caret-right');
    }
    else {
      document.getElementById(feature).style.display = "none"
      document.getElementById(feature + ' caret').classList.remove("fa-caret-right");
      document.getElementById(feature + ' caret').classList.add('fa-caret-down');
    }
  }

  checkIfTableShown(feature) {
    if (document.getElementById(feature).style.display == 'none') {
      return false;
    }
    return true;
  }
  
  openFeatureAudit(): void {
    const dialogRef = this.dialog.open(FeatureAuditComponent, {
      width: '801px',
      maxHeight: '500px',
      data: this.audits
    })
  }


  ngOnInit(): void {
  }


}
