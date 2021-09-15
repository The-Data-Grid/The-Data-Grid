import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';
import { SetupObjectService } from '../../setup-object.service';
import { SetupObject, TableObject } from '../../responses'
import { environment } from '../../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../../dropdown-settings'
import { AppliedFilterSelections } from '../../models'

@Component({
  selector: 'app-item-creation',
  templateUrl: './item-creation.component.html',
  styleUrls: ['./item-creation.component.css']
})
export class ItemCreationComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ItemCreationComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private apiService: ApiService,
    private setupObjectService: SetupObjectService,
    public dialog: MatDialog
  ) { }

  setupObject;
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
  page = "ItemCreation"
  globalSelectors = {};
  globalDefaultColumns = []
  globalReturnableIDs = [];
  item = this.data.item;
  treeIDObject = this.data;

  ngOnInit() {
    this.getSetupObject();
  }

  getSetupObject() {
    if (USE_FAKE_DATA) {
      this.setupObject = SetupObject;
    }
    else {
      this.apiService.getSetupObject().subscribe((res) => {
        this.setupObject = res;
        this.globalSelectors = this.setupObjectService.getGlobalSelectors(this.setupObject, this.appliedFilterSelections, this.globalReturnableIDs, this.globalDefaultColumns, false)
      });
    }
  }

  openItemCreation(treeIDObject): void {
    const dialogRef = this.dialog.open(ItemCreationComponent, {
      width: '801px',
      data: treeIDObject
    })
  }

  close() {
    this.dialogRef.close();
  }

}
