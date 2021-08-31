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
  // attributeSelectors;
  // observationSelectors;
  // selectedFeature;
  // featureSelectors;
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

  // defaultColumns = []
  // rootFeatures = []
  // featuresToChildren = {}
  // dataTableColumns = [];
  // dropdownList = FakeData;
  globalSelectors = {};
  // selectorsLoaded: boolean = false;
  // idInfo;
  // featureIndex = this.data.index;
  // featureName = this.data.name;
  returnableIDs = [];
  globalDefaultColumns = []
  globalReturnableIDs = [];
  itemIndex = this.data;
  item;
  itemToColumns = {};
  attributeColumns = [];

  ngOnInit() {
    this.getSetupObject();
  }

  getSetupObject() {
    if (USE_FAKE_DATA) {
      this.setupObject = SetupObject;
    }
    else {
      this.apiService.getSetupTableObject().subscribe((res) => {
        this.setupObject = res;
        this.item = this.setupObject.items[this.itemIndex];

        // this.getFeatureID();
        // this.getFeatureSelectors();
        // this.getFeatureChildren();
        // this.getAttributeAndObservationColumns()
        // this.featureReturnableIDs = this.setupObjectService.getFeatureReturnableIDs(this.setupObject, this.featureIndex)
        this.globalSelectors = this.setupObjectService.getGlobalSelectors(this.setupObject, this.appliedFilterSelections, this.globalReturnableIDs, this.globalDefaultColumns, false)
        this.setupObjectService.mapAllItemRelatedColumns(this.setupObject, this.itemIndex, this.itemToColumns, false);
        this.attributeColumns = this.setupObjectService.getItemAttributeColumns(this.setupObject, this.itemIndex);
        console.log(this.attributeColumns)
      });
    }
  }


  // getFeatureID() {
  //   this.idInfo = this.setupObjectService.getFeatureItemChildren(this.setupObject, this.featureIndex);
  // }

  // getFeatureSelectors() {
  //   // parse feature columns
  //   this.featureSelectors = this.setupObjectService.getFeatureFilterSelectors(
  //     this.setupObject,
  //     this.appliedFilterSelections,
  //     this.defaultColumns
  //   );
  // }

  // getFeatureChildren() {
  //   // map features to children
  //   this.featuresToChildren = this.setupObjectService.getFeaturesToChildren(this.setupObject);
  //   this.selectorsLoaded = true
  //   let features = this.setupObjectService.getFeaturesToChildren(this.setupObject);
  //   let subfeatureIndices = features[this.featureIndex];
  //   for (var i = 0; i < subfeatureIndices.length; i++) {
  //     this.subfeatures.push(this.setupObject.features[subfeatureIndices[i]]);
  //   }
  // }

  // getAttributeAndObservationColumns() {
  //   this.attributeSelectors = this.setupObjectService.getFeatureInputSelectors(this.setupObject, this.appliedFilterSelections, [], false);
  //   this.observationSelectors = this.setupObjectService.getFeatureInputSelectors(this.setupObject, this.appliedFilterSelections, [], true);
  // }

  openItemCreation(itemIndex): void {
    const dialogRef = this.dialog.open(ItemCreationComponent, {
      width: '801px',
      data: itemIndex
    })
  }

  close() {
    this.dialogRef.close();
  }

}
