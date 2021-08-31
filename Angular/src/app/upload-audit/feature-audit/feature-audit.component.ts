import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';
import { SetupObjectService } from '../../setup-object.service';
import { SetupObject, TableObject } from '../../responses'
import { environment } from '../../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../../dropdown-settings'
import { TableObjectService } from '../../table-object.service';
import { AppliedFilterSelections } from '../../models'

@Component({
  selector: 'app-feature-audit',
  templateUrl: './feature-audit.component.html',
  styleUrls: ['./feature-audit.component.css'],
})
export class FeatureAuditComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<FeatureAuditComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private apiService: ApiService,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) {
  }

  setupObject;
  subfeatures = [];
  attributeSelectors;
  observationSelectors;
  selectedFeature;
  featureSelectors;
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

  defaultColumns = []
  rootFeatures = []
  featuresToChildren = {}
  dataTableColumns = [];
  dropdownList = FakeData;
  globalSelectors = {};
  selectorsLoaded: boolean = false;
  idInfo;
  page = "FeaturesAuditPage"

  featureIndex = this.data.index;
  featureName = this.data.name;
  featureReturnableIDs = [];
  globalDefaultColumns = []
  globalReturnableIDs = [];

  dummy = [
    {
      title: "Global Data",
      type: "global_data"
    },
    {
      title: this.featureName + " ID",
      type: "id"
    },
    {
      title: "Action",
      type: "action",
      content: [
        "Observation",
        "Removal",
        "Permanent Deletion Request"
      ]
    },
    {
      title: this.featureName + " Attributes",
      type: "attributes",
    },
    {
      title: this.featureName + " Observation",
      type: "observation",
    }
  ]

  ngOnInit() {
    this.getSetupObject();
  }

  close() {
    this.dialogRef.close();
  }

  getSetupObject() {
    if (USE_FAKE_DATA) {
      this.setupObject = SetupObject;
      this.getFeatureID();
      this.getFeatureSelectors();
      this.getFeatureChildren();
      this.getAttributeAndObservationColumns()
    }
    else {
      this.apiService.getSetupTableObject().subscribe((res) => {
        this.setupObject = res;
        this.getFeatureID();
        this.getFeatureSelectors();
        this.getFeatureChildren();
        this.getAttributeAndObservationColumns()
        this.featureReturnableIDs = this.setupObjectService.getFeatureReturnableIDs(this.setupObject, this.featureIndex)
        this.globalSelectors = this.setupObjectService.getGlobalSelectors(this.setupObject, this.appliedFilterSelections, this.globalReturnableIDs, this.globalDefaultColumns, false)
      });
    }
  }

  getFeatureID() {
    this.idInfo = this.setupObjectService.getFeatureItemChildren(this.setupObject, this.featureIndex);
  }

  getFeatureSelectors() {
    // parse feature columns
    this.featureSelectors = this.setupObjectService.getFeatureFilterSelectors(
      this.setupObject,
      this.appliedFilterSelections,
      this.defaultColumns
    );
  }

  getFeatureChildren() {
    // map features to children
    this.featuresToChildren = this.setupObjectService.getFeaturesToChildren(this.setupObject);
    this.selectorsLoaded = true
    let features = this.setupObjectService.getFeaturesToChildren(this.setupObject);
    let subfeatureIndices = features[this.featureIndex];
    for (var i = 0; i < subfeatureIndices.length; i++) {
      this.subfeatures.push(this.setupObject.features[subfeatureIndices[i]]);
    }
  }

  getAttributeAndObservationColumns() {
    this.attributeSelectors = this.setupObjectService.getFeatureInputSelectors(this.setupObject, this.appliedFilterSelections, [], false);
    this.observationSelectors = this.setupObjectService.getFeatureInputSelectors(this.setupObject, this.appliedFilterSelections, [], true);
  }
}
