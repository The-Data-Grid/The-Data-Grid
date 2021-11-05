import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppliedFilterSelections } from '../models'
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit {
  // variables for table 
  dataTableColumns = [];
  rows = [];
  tableObject;
  currentlyEditingCell = {};
  cellEdited = {};
  editingMode: boolean = false;
  oldRowInfo = [];
  oldCellEdited = {};
  page = "AuditsPage"

  // variables for filtering sidebar
  filterBy = "Feature";
  setupObject;
  defaultColumnIDs = []; //default denotes which return columns are to be included in queries by default
  rootFeatures = [];
  selectedFeature;
  featuresToChildren = {};
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

  // the following variables are for multiselect dropdowns:
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;
  numericRelation: string[][] = [[">=", "gte"], ["<=", "lte"], [">", "gt"], ["<", "lt"], ["=", "equal"]]

  treeIDobjects;
  IDreturnableIDs;
  attributeReturnableIDs;

  constructor(private apiService: ApiService,
    public datepipe: DatePipe,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) { }

  ngOnInit() {
    this.getSetupObject();
  }


  getSetupObject() {
    this.apiService.getSetupObject().subscribe((res) => {
      console.log("using data from express server")
      this.setupObject = res;
      this.parseSetupObject();
      console.log("setupObject: :", this.setupObject)
    });
  }

  parseSetupObject() {
    // get root features
    this.rootFeatures = this.setupObjectService.getRootFeatures(this.setupObject);
    this.applyFilters();
  }

  getTableObject() {
    // clear the column headers
    this.dataTableColumns = [];
    this.apiService.getTableObject(this.selectedFeature, this.defaultColumnIDs, this.appliedFilterSelections, this.IDreturnableIDs.concat(this.attributeReturnableIDs)).subscribe((res) => {
      this.tableObject = res;
      console.log(this.tableObject)
      this.rows = this.tableObjectService.getRows(this.setupObject, this.tableObject, this.dataTableColumns);
    });
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
    if (!this.selectedFeature) { return; }
    this.getTableObject();
  }

  onFeatureSelection() {
    this.treeIDobjects = this.setupObjectService.getAllFeatureItemRelatedColumns(this.setupObject, this.selectedFeature.index);
    this.IDreturnableIDs = this.setupObjectService.getAllIDreturnableIDs(this.treeIDobjects);
    this.attributeReturnableIDs = this.setupObjectService.getAllAttributeReturnableIDs(this.treeIDobjects);
    this.selectorsLoaded = true

    console.log("treeIDobjects:", this.treeIDobjects)
  }

  // dont delete:
  onItemSelect(item: any) {
    // console.log(item);
  }
  onSelectAll(items: any) {
    // console.log(items);
  }
}
