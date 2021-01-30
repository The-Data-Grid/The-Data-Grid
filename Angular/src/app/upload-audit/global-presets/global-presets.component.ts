import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';
import { SetupObjectService } from '../../setup-object.service';
import { SetupObject, TableObject } from '../../responses'
import { environment } from '../../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;
import { AppliedFilterSelections } from '../../models'


interface Data {
  name: string,
  features: Object
}

@Component({
  selector: 'app-global-presets',
  templateUrl: './global-presets.component.html',
  styleUrls: ['./global-presets.component.css'],
})
export class GlobalPresetsComponent implements OnInit {

  constructor(private apiService: ApiService, public dialogRef: MatDialogRef<GlobalPresetsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data, private setupObjectService: SetupObjectService) { }

  setupObject;
  globalSelectors;
  appliedFilterSelections: AppliedFilterSelections = {
    numericChoice: {},
    numericEqual: {},
    calendarRange: {},
    calendarEqual: {},
    dropdown: {},
    searchableDropdown: {},
    checklistDropdown: {},
    searchableChecklistDropdown: {},
    text: {},
    bool: {},
    _placeholder: "placeholder"
  };
  defaultColumns = [];

  ngOnInit(): void {
    this.getSetupTableObject();
  }

  getSetupTableObject() {
    this.apiService.getSetupTableObject().subscribe((res) => {
      USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;
      this.globalSelectors = this.setupObjectService.getGlobalSelectors(
        this.setupObject,
        this.appliedFilterSelections,
        this.defaultColumns);
      console.log(this.globalSelectors)
    });
  }

  close() {
    this.dialogRef.close();
  }

}
