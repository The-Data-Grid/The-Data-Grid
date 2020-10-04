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

  constructor(public dialog: MatDialog, private datePipe: DatePipe) {
   }

  audit = { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" };

  audits = [
    {name:"Restroom Audit", included: true, features: [{name: "Toilet", included: true, actions:[{action: "Removal", updated: "5 mins ago", room: "1201B", c_number: 8}, {action: "Creation", updated: "3 days ago", room:"1201B", c_number: 4}, {action: "Observation", updated: "3 days ago", room:"1201B", c_number: 5}]}, {name: "Sink", included: true, actions:[{action: "Deletion Request", updated: "45 mins ago", room: "1201B", c_number: 3}, {action: "Creation and Observation", updated: "4 months ago", room: "1201B", c_number: 7}]}, {name: "Urinal", included: true, actions:[{action: "Creation", updated: "1 hr ago", room: "1201B", c_number: 2}, {action: "Observation", updated: "1 hr ago", room: "1201B", c_number: 1}]}]},
    {name: "Irrigation Audit", included: true, features: [{name: "Sprinkler", included: true, actions:[{action: "Creation", updated: "12 mins ago", room: "23A", c_number: 2}, {action:"Observation", updated: "33 mins ago", room:"23A", c_number:4}]}, {name: "Canal", included: true, actions:[{action: "Creation and Observation", updated: "3 weeks ago", room: "23A", c_number: 13}]}, {name: "Sewer", included: true, actions:[{action: "Deletion Request", updated: "3 weeks ago", room: "23A", c_number: 9}, {action: "Observation and Creation", updated: "3 weeks ago", room: "23A", c_number: 3}]}]},
    {name: "Boiler Room Audit", included: true, features: [{name: "Boiler", included: true, actions:[{action: "Removal", updated: "1 year ago", room: "11C", c_number: 22},{action: "Creation", updated: "12 years ago", room: "11C", c_number: 16}]}, {name: "Pump", included: true, actions:[{action: "Deletion Request", updated: "3 years ago", room: "12B", c_number: 9}, {action:"Creation", updated:"65 years ago", room:"12B", c_number: 7}]}]}
  ]


  openRootFeatures(): void {
    const dialogRef = this.dialog.open(RootFeaturesComponent, {
      width: '400px',
      height: '600px',
      data: this.audits
    })
  }

  openGlobalPresets(): void {
    const dialogRef = this.dialog.open(GlobalPresetsComponent, {
      width: '400px',
      height: '600px',
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
  
  openFeatureAudit(): void {
    const dialogRef = this.dialog.open(FeatureAuditComponent, {
      width: '400px',
      height: '600px',
      data: this.audits
    })
  }

  ngOnInit(): void {
  }

}
