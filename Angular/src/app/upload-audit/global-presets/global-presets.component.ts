import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';
import { SetupObjectService } from '../../setup-object.service';
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
    searchableDropdown: [],
    checklistDropdown: [],
    searchableChecklistDropdown: [],
    text: {},
    bool: {},
    _placeholder: "placeholder"
  };
  defaultColumns = [];
  selectorsLoaded: boolean = false;
  globalReturnableIDs = [];
  globalTreeIDobjects = {}


  ngOnInit(): void {
    this.getSetupObject();
  }

  getSetupObject() {
    this.apiService.getSetupObject().subscribe((res) => {
      this.setupObject = res;
      this.globalTreeIDobjects = this.setupObjectService.getAllGlobalItemRelatedColumns(this.setupObject)
      console.log("globalTreeIDobjects", this.globalTreeIDobjects)
      this.globalReturnableIDs = this.setupObjectService.getAllIDreturnableIDs(this.globalTreeIDobjects)
      this.selectorsLoaded = true;
    });
  }

  close() {
    this.dialogRef.close();
  }

}
