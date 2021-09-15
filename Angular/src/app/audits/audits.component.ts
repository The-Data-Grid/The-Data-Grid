import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppliedFilterSelections } from '../models'

import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import { SetupObject, TableObject } from '../responses'
import { environment } from '../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit {
  // Variables for table 
  dataTableColumns = [];
  tableRows = [];
  tableObject;
  currentlyEditingCell = {};
  cellEdited = {};
  editingMode: boolean = false;
  oldRowInfo = [];
  oldCellEdited = {};
  page = "AuditsPage"

  // Variables for filtering 
  filterBy = "Feature";
  setupObject;
  defaultColumnIDs = []; // Default denotes which columns are to be included in queries by default
  globalReturnableIDs = [];
  featureReturnableIDs = [];
  rootFeatures = [];
  selectedFeature;
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
  featureSelectors = {};
  globalSelectors = {};
  selectorsLoaded: boolean = false;
  dropdownOptions = {
    placeholder: "hello"
  };

  // Variables for multiselect dropdowns:
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;
  numericRelation: string[][] = [[">=", "gte"], ["<=", "lte"], [">", "gt"], ["<", "lt"], ["=", "equal"]]

  constructor(private apiService: ApiService,
    public datepipe: DatePipe,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) { }

  ngOnInit() {
    this.getSetupObject();
  }

  getSetupObject() {
    if (USE_FAKE_DATA) {
      console.log("using data from responses.ts")
      this.setupObject = SetupObject;
      this.parseSetupObject();
    }
    else {
      this.apiService.getSetupObject().subscribe((res) => {
        console.log("using data from express server")
        this.setupObject = res;
        this.parseSetupObject();
        console.log("setupObject:");
        console.log(this.setupObject)
      });
    }
  }

  parseSetupObject() {
    // parse global columns
    this.globalSelectors = this.setupObjectService.getGlobalSelectors(
      this.setupObject,
      this.appliedFilterSelections,
      this.defaultColumnIDs,
      this.globalReturnableIDs,
      true
    );

    // get root features
    this.rootFeatures = this.setupObjectService.getRootFeatures(this.setupObject);

    // parse feature columns
    this.featureSelectors = this.setupObjectService.getFeatureFilterSelectors(
      this.setupObject,
      this.appliedFilterSelections,
      this.defaultColumnIDs);

    // console.log("global selectors:", this.globalSelectors);
    // console.log("feature selectors:", this.featureSelectors);
    // console.log("applied filter selections:", this.appliedFilterSelections);
    // console.log("defaultColumnIDs:", this.defaultColumnIDs);
    this.applyFilters();
    this.selectorsLoaded = true
  }

  getTableObject() {
    // clear the column headers
    this.dataTableColumns = [];
    if (USE_FAKE_DATA) {
      this.tableObject = TableObject;
      this.tableRows = this.tableObjectService.getRows(this.setupObject, this.tableObject, this.dataTableColumns);
    }
    else {
      this.apiService.getTableObject(this.selectedFeature, this.defaultColumnIDs, this.appliedFilterSelections, this.globalReturnableIDs.concat(this.featureReturnableIDs)).subscribe((res) => {
        this.tableObject = res;
        // console.log(this.tableObject)
        this.tableRows = this.tableObjectService.getRows(this.setupObject, this.tableObject, this.dataTableColumns);
        // console.log(this.tableRows)
        // console.log(this.dataTableColumns)
      });
    }
  }

  toggleMetaInfoDisplay(column) {
    column.displayMetaInfo = !column.displayMetaInfo;
    console.log(column.displayMetaInfo)
  }

  updateValue(event, columnName, rowIndex) {
    console.log('inline editing rowIndex', rowIndex);
    this.toggleEditingCell(rowIndex, columnName); //stop editing
    // save the old value
    this.oldRowInfo.push({
      rowIndex: rowIndex,
      columnName: columnName,
      previousValue: this.tableRows[rowIndex][columnName]
    });
    this.cellEdited[rowIndex + columnName] = true;
    this.tableRows[rowIndex][columnName] = event.target.value;
    console.log('UPDATED!', this.tableRows[rowIndex][columnName]);
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
      this.tableRows[obj.rowIndex][obj.columnName] = obj.previousValue;
      this.tableRows = [...this.tableRows];
    });
    this.cellEdited = Object.assign({}, this.oldCellEdited);
    console.log(this.oldCellEdited);
  }

  applyFilters() {
    if (!this.selectedFeature) { return; }
    console.log(this.appliedFilterSelections);
    // console.log(this.globalReturnableIDs);
    this.getTableObject();
  }

  onFeatureSelection() {
    this.featureReturnableIDs = this.setupObjectService.getFeatureReturnableIDs(this.setupObject, this.selectedFeature.index);
    console.log("this.featureReturnableIDs:")
    console.log(this.featureReturnableIDs)
  }

  applyDateFilter = (val: string) => {
    val = this.datepipe.transform(val, 'MM-dd-yyyy');
    // this.tableRows = this.filteredData.filter(function (item) {
    //   if (item.dateConducted.toString().toLowerCase().indexOf(val) !== -1 || !val) {
    //     return true;
    //   }
    // });
  }

  // dont delete:
  onItemSelect(item: any) {
    // console.log(item);
  }
  onSelectAll(items: any) {
    // console.log(items);
  }
}
