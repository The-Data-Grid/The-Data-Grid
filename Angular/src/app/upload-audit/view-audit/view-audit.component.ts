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
    {name:"Restroom Audit", included: true, features: [{name: "Toilet", included: true}, {name: "Sink", included: true}, {name: "Urinal", included: true}]},
    {name: "Irrigation Audit", included: true, features: [{name: "Sprinkler", included: true}, {name: "Canal", included: true}, {name: "Sewer", included: true}]},
    {name: "Boiler Room Audit", included: true, features: [{name: "Boiler", included: true}, {name: "Pump", included: true}]}
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
