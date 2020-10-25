import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import { DatePipe } from '@angular/common';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { setupObject, tableObject } from '../responses'
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
  // the following are for multiselect dropdowns
  dropdownList = [
    { item_id: 1, item_text: 'Mumbai' },
    { item_id: 2, item_text: 'Bangaluru' },
    { item_id: 3, item_text: 'Pune' },
    { item_id: 4, item_text: 'Navsari' },
    { item_id: 5, item_text: 'New Delhi' }
  ];
  searchableDropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'item_id',
    textField: 'item_text',
    closeDropDownOnSelection: true,
    allowSearchFilter: true
  };
  checklistDropdownSettings: IDropdownSettings = {
    enableCheckAll: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true
  };
  searchableChecklistDropdownSettings: IDropdownSettings = {
    enableCheckAll: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true
  };

  featureSelectors = {};
  globalSelectors = {};

  constructor(private apiService: ApiService, public datepipe: DatePipe, private setupObjectService: SetupObjectService) { }

  ngOnInit() {
    this.getSetupObject();
  }

  getSetupObject() {
    this.apiService.getSetupTableObject(null).subscribe((res) => {
      this.USE_FAKE_DATA ? this.setupObject = setupObject : this.setupObject = res;

      // parse global features
      this.globalSelectors = this.setupObjectService.getGlobalSelectors(
        this.setupObject,
        this.appliedFilterSelections,
        this.defaultColumns);
      // get root features
      this.rootFeatures = this.setupObjectService.getRootFeatures(this.setupObject);


      let featureColumns = [];
      let j = 0;
      // for each feature
      this.setupObject.children[0].forEach((featureIndex, k) => {
        featureColumns = [];
        // find feature's observation columns
        this.setupObject.features[featureIndex].children[0].forEach((observationColumnIndex, i) => {
          featureColumns.push({
            column: this.setupObject.columns[observationColumnIndex],
            returnableID: this.getReturnableID([0, k, 0, i])
          });
        });
        // find feature's attribute columns
        this.setupObject.features[featureIndex].children[1].forEach((attributeColumnIndex, i) => {
          featureColumns.push({
            column: this.setupObject.columns[attributeColumnIndex],
            returnableID: this.getReturnableID([0, k, 1, i])
          });
        });
        this.featureSelectors[this.setupObject.features[featureIndex].frontendName] = this.parseColumns(featureColumns);
      });

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

  getReturnableID(tree: any[]): string {
    let treeID = tree.join('>');
    return setupObject.treeIDToReturnableID[treeID];
  }

  parseColumns(infos): any {
    let selectors = {
      numericChoice: [],
      numericEqual: [],
      calendarRange: [],
      calendarEqual: [],
      dropdown: [],
      searchableDropdown: [],
      checklistDropdown: [],
      searchableChecklistDropdown: [],
      text: [],
      bool: []
    };

    infos.forEach(info => {
      if (info.column.filterSelector) {
        //by default, returnableID to user's input
        //range and multiselect selectors have different format for recording 
        this.appliedFilterSelections[info.returnableID] = null;

        switch (info.column.filterSelector.selectorKey) {
          case "dropdown": { selectors.dropdown.push(info); break; }
          case "numericChoice": { selectors.numericChoice.push(info); break; }
          case "numericEqual": {
            selectors.numericEqual.push(info);
            this.appliedFilterSelections[info.returnableID] = { relation: null, input: null }; break;
          }
          case "calendarRange": {
            selectors.calendarRange.push(info);
            this.appliedFilterSelections[info.returnableID] = { start: null, end: null }; break;
          }
          case "calendarEqual": { selectors.calendarEqual.push(info); break; }
          case "searchableDropdown": {
            selectors.searchableDropdown.push(info);
            this.appliedFilterSelections[info.returnableID] = []; break;
          }
          case "checklistDropdown": {
            selectors.checklistDropdown.push(info);
            this.appliedFilterSelections[info.returnableID] = []; break;
          }
          case "searchableChecklistDropdown": {
            selectors.searchableChecklistDropdown.push(info);
            this.appliedFilterSelections[info.returnableID] = []; break;
          }
          case "text": { selectors.text.push(info); break; }
          case "bool": { selectors.bool.push(info); break; }
        }
      }
      if (info.column.default) {
        this.defaultColumns.push(info.column.returnableID);
      }
    });
    return selectors;
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
