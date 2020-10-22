import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';

interface Data {
  name: string,
  features: Object
}

@Component({
  selector: 'app-global-presets',
  templateUrl: './global-presets.component.html',
  styleUrls: ['./global-presets.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GlobalPresetsComponent implements OnInit {

  constructor(private apiService: ApiService, public dialogRef: MatDialogRef<GlobalPresetsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data) { }

  setupObject;
  globalSelectors;

  ngOnInit(): void {
    this.getSetupTableObject();
  }

  getSetupTableObject() {
    this.apiService.getSetupTableObject(null).subscribe((res) => {
      this.setupObject = res;

      // parse global columns
      this.globalSelectors = this.setupObject.globalColumns;

      console.log(this.globalSelectors);
    });
  }

  close() {
    this.dialogRef.close();
  }

}
