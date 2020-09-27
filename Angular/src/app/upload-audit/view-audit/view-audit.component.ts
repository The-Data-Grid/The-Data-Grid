import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RootFeaturesComponent } from '../root-features/root-features.component';
import { GlobalPresetsComponent} from '../global-presets/global-presets.component';

@Component({
  selector: 'app-view-audit',
  templateUrl: './view-audit.component.html',
  styleUrls: ['./view-audit.component.css']
})
export class ViewAuditComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  audit = { auditName: "Bathroom Audit 1", uploadStatus: "uploaded", _id: "1234567890" };


  audits = [
    {name:"Restroom Audit", features: ["Toilet", "Sink", "Urinal"]},
    {name: "Irrigation Audit", features: ["Sprinkler", "Canal", "Sewer"]},
    {name: "Boiler Room Audit", features: ["Boiler", "Pump"]}
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
  
  ngOnInit(): void {
  }

}
