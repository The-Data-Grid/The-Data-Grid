import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';

import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import { SetupObject, TableObject } from '../responses'
// import { TableObject } from '../responses';
// import { SetupObject} from '../setupObjectTry1';
import { environment } from '../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit {
  // variables for table 
  dataTableColumns = [];
  rows = [];
  tableObject;
  currentlyEditingCell = {};
  cellEdited = {};
  editingMode: boolean = false;
  oldRowInfo = [];
  oldCellEdited = {};

  // variables for filtering sidebar
  filterBy = "Submission";
  setupObject;
  defaultColumns = [];
  rootFeatures = [];
  selectedFeature;
  featuresToChildren = {};
  appliedFilterSelections = {};
  featureSelectors = {};
  globalSelectors = {};
  selectorsLoaded: boolean = false;

  // the following are for multiselect dropdowns:
  dropdownList = FakeData;
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;


  constructor(private apiService: ApiService, 
    public datepipe: DatePipe, 
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) { }

  ngOnInit() {
    this.getSetupObject();
  }

  getSetupObject() {
    this.apiService.getSetupTableObject(null).subscribe((res) => {
      USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;

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

      console.log("global selectors:");
      console.log(this.globalSelectors);
      console.log("feature selectors:");
      console.log(this.featureSelectors);
      console.log("applied filter selections:");
      console.log(this.appliedFilterSelections);
      console.log("featuresToChildren:");
      console.log(this.featuresToChildren);
      this.applyFilters();
      this.selectorsLoaded = true
    });
  }

  getTableObject() {
    // clear the column headers
    this.dataTableColumns = [];

    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      USE_FAKE_DATA ? this.tableObject = TableObject : this.tableObject = res;

      this.rows = this.tableObjectService.getRows(this.setupObject, this.tableObject, this.dataTableColumns);
    });
  }

  updateValue(event, columnName, rowIndex) {
    console.log('inline editing rowIndex', rowIndex);
    this.toggleEditingCell(rowIndex, columnName); //stop editing
    // save the old value
    this.oldRowInfo.push({
      rowIndex: rowIndex,
      columnName: columnName,
      previousValue: this.rows[rowIndex][columnName]
    });
    this.cellEdited[rowIndex + columnName] = true;
    this.rows[rowIndex][columnName] = event.target.value;
    console.log('UPDATED!', this.rows[rowIndex][columnName]);
  }

  toggleEditingCell(rowIndex, columnName) {
    if (!this.editingMode) { return; }
    if (!this.currentlyEditingCell[rowIndex + columnName]) {
      this.currentlyEditingCell[rowIndex + columnName] = true;
      console.log("now editing cell");
    }
    else {
      this.currentlyEditingCell[rowIndex + columnName] = false;
      console.log("now not editing cell");
    }
  }

  toggleEditingMode() {
    this.editingMode = !this.editingMode;
    // if in editing mode, make a copy of rows. if not in editing mode, clear editing object
    if (this.editingMode) {
      console.log("clearing old row info");
      this.oldRowInfo = [];
      this.oldCellEdited = Object.assign({}, this.cellEdited);
    }
    else {
      this.currentlyEditingCell = {};
    }
  }

  cancelEditing() {
    this.toggleEditingMode();
    // restore cellEdited object and row info to previous state
    this.oldRowInfo.forEach(obj => {
      this.rows[obj.rowIndex][obj.columnName] = obj.previousValue;
      this.rows = [...this.rows];
    });
    this.cellEdited = Object.assign({}, this.oldCellEdited);
    console.log(this.oldCellEdited);
  }

  applyFilters() {
    // console.log(this.appliedFilterSelections);

    /* get api response */
    if (!this.selectedFeature) {
      return;
    }
    this.getTableObject();
  }


  applyDateFilter = (val: string) => {
    val = this.datepipe.transform(val, 'MM-dd-yyyy');
    // console.log(val);

    // this.rows = this.filteredData.filter(function (item) {
    //   if (item.dateConducted.toString().toLowerCase().indexOf(val) !== -1 || !val) {
    //     return true;
    //   }
    // });
  }


  onItemSelect(item: any) {
    // console.log(item);
  }
  onSelectAll(items: any) {
    // console.log(items);
  }

}
