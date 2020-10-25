import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import { DatePipe } from '@angular/common';
import { setupObject, tableObject } from '../responses'
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit {
  USE_FAKE_DATA: boolean = true;

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
  datatypes;
  defaultColumns = [];
  rootFeatures = [];
  selectedFeature;
  appliedFilterSelections = {};
  selectorsLoaded: boolean = false;
  // the following are for multiselect dropdowns:
  dropdownList = FakeData;
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;

  featureSelectors = {};
  globalSelectors = {};

  constructor(private apiService: ApiService, public datepipe: DatePipe, private setupObjectService: SetupObjectService) { }

  ngOnInit() {
    this.getSetupObject();
  }

  getSetupObject() {
    this.apiService.getSetupTableObject(null).subscribe((res) => {
      this.USE_FAKE_DATA ? this.setupObject = setupObject : this.setupObject = res;

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

      // get datatypes array
      this.datatypes = this.setupObject.datatypes;

      console.log("global selectors:");
      console.log(this.globalSelectors);
      console.log("feature selectors:");
      console.log(this.featureSelectors);
      console.log("applied filter selections:");
      console.log(this.appliedFilterSelections);
      this.applyFilters();
      this.selectorsLoaded = true
    });
  }

  getTableObject() {
    // clear the column headers
    this.dataTableColumns = [];
    this.rows = [];
    var i;

    this.apiService.getTableObject(this.selectedFeature, this.defaultColumns, this.appliedFilterSelections).subscribe((res) => {
      this.USE_FAKE_DATA ? this.tableObject = tableObject : this.tableObject = res;

      // construct the column header arrays
      for (i = 0; i < this.tableObject.columnIndex.length; i++) {
        // globals
        if (this.tableObject.columnIndex[i][0] === null) {
          var idx = this.tableObject.columnIndex[i][1];
          var datatypeIdx = this.setupObject.globalColumns[idx].datatype;

          this.dataTableColumns.push({
            prop: this.setupObject.globalColumns[idx].columnFrontendName,
            type: this.datatypes[datatypeIdx],
            id: this.setupObject.globalColumns[idx].columnID
          });
        }
        // features
        else {
          var idx1 = this.tableObject.columnIndex[i][0];
          var idx2 = this.tableObject.columnIndex[i][1];
          var datatypeIdx = this.setupObject.featureColumns[idx1].dataColumns[idx2].datatype;

          this.dataTableColumns.push({
            prop: this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName,
            type: this.datatypes[datatypeIdx],
            id: this.setupObject.globalColumns[idx].columnID
          });
        }
      }

      //add rows to the table one by one
      this.tableObject.rowData.forEach(element => {
        var row = {};
        row["_hyperlinks"] = {};

        // fill out the row object
        for (i = 0; i < this.tableObject.columnIndex.length; i++) {
          // global
          if (this.tableObject.columnIndex[i][0] === null) {
            var idx = this.tableObject.columnIndex[i][1];
            var datatypeIdx = this.setupObject.globalColumns[idx].datatype;

            switch (this.datatypes[datatypeIdx]) {
              case "string": {
                row[this.setupObject.globalColumns[idx].columnFrontendName] = element[i]; break;
              }
              case "hyperlink": {
                row[this.setupObject.globalColumns[idx].columnFrontendName] = element[i].displayString;
                row["_hyperlinks"][this.setupObject.globalColumns[idx].columnFrontendName] = element[i].URL; break;
              }
              case "bool": {
                if (element[i]) {
                  row[this.setupObject.globalColumns[idx].columnFrontendName] = "True";
                }
                else {
                  row[this.setupObject.globalColumns[idx].columnFrontendName] = "False";
                } break;
              }
            }
          }
          // feature
          else {
            var idx1 = this.tableObject.columnIndex[i][0];
            var idx2 = this.tableObject.columnIndex[i][1];
            var datatypeIdx = this.setupObject.featureColumns[idx1].dataColumns[idx2].datatype;

            switch (this.datatypes[datatypeIdx]) {
              case "string": {
                row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i]; break;
              }
              case "hyperlink": {
                row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i].displayString;
                row["_hyperlinks"][this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i].URL; break;
              }
              case "bool": {
                if (element[i]) {
                  row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = "True";
                }
                else {
                  row[this.setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = "False";
                } break;
              }
            }
          }
        }
        // console.log(row);
        this.rows.push(row);
      });
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
