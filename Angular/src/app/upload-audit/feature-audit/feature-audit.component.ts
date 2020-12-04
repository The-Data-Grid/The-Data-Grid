import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../api.service';
import { SetupObjectService } from '../../setup-object.service';
import { SetupObject, TableObject } from '../../responses'
import { environment } from '../../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../../dropdown-settings'
import { TableObjectService } from '../../table-object.service';
// import { TableObject } from '../responses';
// import { SetupObject} from '../setupObjectTry1';



@Component({
  selector: 'app-feature-audit',
  templateUrl: './feature-audit.component.html',
  styleUrls: ['./feature-audit.component.css'],
})
export class FeatureAuditComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<FeatureAuditComponent>,private apiService: ApiService, private setupObjectService: SetupObjectService, private tableObjectService: TableObjectService) {
  }

  setupObject;
  subfeatures = [];
  attributeSelectors;
  observationSelectors;
  selectedFeature;
  featureSelectors;
  appliedFilterSelections = {}
  defaultColumns = []
  rootFeatures = []
  featuresToChildren = {}
  dataTableColumns = [];
  // selectedFeature;
  tableObject;
  rows = [];
  dropdownList = FakeData;
  globalSelectors = {};
  selectorsLoaded: boolean = false;
  idInfo;

  dummy = [
    {
      title: "Global Data",
      content: []
    },
    {
      title: "Toilet ID",
      content: [
        "Building, Building Name: Mathematical Sciences",
        "Room, Room Number: 1349",
        "Toilet, Clockwise Number: 2"
      ]
    },
    {
      title: "Action",
      content: [
        "Observation",
        "Removal",
        "Permanent Deletion Request"
      ]
    },
    {
      title: "Toilet Attributes",
      content: [
        "Intake Valve*: 32"
      ]
    },
    {
      title: "Toilet Observation",
      content: [
        "Date Conducted:",
        "GPF: 3.14"
      ]
    },
    {
      title: "Subfeature",
      content: [
        "Basin",
        "Flushometer"
      ]
    }
  ]

  featureIndex = 0;

  ngOnInit() {
    this.getSetupObject();

  }

  close() {
    this.dialogRef.close();
  }

  getSetupObject() {
    this.apiService.getSetupTableObject().subscribe((res) => {
      USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;

      this.idInfo = this.setupObjectService.getFeatureItemChildren(this.setupObject,this.featureIndex);

      // parse global columns
      this.globalSelectors = this.setupObjectService.getGlobalSelectors(
        this.setupObject,
        this.appliedFilterSelections,
        this.defaultColumns);

      // get root features
      this.rootFeatures = this.setupObjectService.getRootFeatures(this.setupObject);

      // parse feature columns
      this.featureSelectors = this.setupObjectService.getFeatureSelectors(
        this.setupObject,
        this.appliedFilterSelections,
        this.defaultColumns);

      // map features to children
      this.featuresToChildren = this.setupObjectService.getFeaturesToChildren(this.setupObject);

      this.applyFilters();
      this.selectorsLoaded = true
      let features = this.setupObjectService.getFeaturesToChildren(this.setupObject);
      let subfeatureIndices = features[this.featureIndex];
      for (var i = 0; i < subfeatureIndices.length; i++) {
        this.subfeatures.push(this.setupObject.features[subfeatureIndices[i]]);
      }
      this.selectedFeature = this.setupObjectService.getFeatureInputSelectors(this.setupObject,[],[],true);
      this.observationSelectors = this.setupObjectService.getFeatureInputSelectors(this.setupObject,[],[],true);
      this.selectedFeature = this.rootFeatures

    });
  }

  applyFilters() {
    if (!this.selectedFeature) { return; }
    this.getTableObject();
  }

  getTableObject() {
    // clear the column headers
    this.dataTableColumns = [];

    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      USE_FAKE_DATA ? this.tableObject = TableObject : this.tableObject = res;

      this.rows = this.tableObjectService.getRows(this.setupObject, this.tableObject, this.dataTableColumns);
    });
  }


  

}
