import { Injectable } from '@angular/core';
import {
  IDX_OF_FEATURES_ARR,
  IDX_OF_GLOBAL_ITEM_IDX,
  IDX_OF_ID_COL_IDXS,
  IDX_OF_OBSERVATION_COL_IDXS,
  IDX_OF_ATTRIBUTE_COL_IDXS
} from './setup-object.service'

@Injectable({
  providedIn: 'root'
})
export class TableObjectService {

  constructor() { }

  getTableObject(setupObject, tableObject) {
    let dataTableColumns = [];
    let rows = [];
    let treeID = [];
    // get datatypes array
    let datatypes = setupObject.datatypes;

    // construct the column header arrays
    tableObject.returnableColumnIDs.forEach(columnID => {
      treeID = setupObject.returnableIDToTreeID[columnID].split('>')
      //need column name, type, and index

      treeID.forEach(element => {
        if (element === IDX_OF_GLOBAL_ITEM_IDX) {

        }
        else {
          
        }

    });

      for (let i = 0; i < tableObject.returnableColumnIDs.length; i++) {
        // globals
        if (tableObject.columnIndex[i][0] === null) {
          var idx = tableObject.columnIndex[i][1];
          var datatypeIdx = setupObject.globalColumns[idx].datatype;


          this.dataTableColumns.push({
            prop: setupObject.globalColumns[idx].columnFrontendName,
            type: this.datatypes[datatypeIdx],
            id: setupObject.globalColumns[idx].columnID
          });
        }
        // features
        else {
          var idx1 = tableObject.columnIndex[i][0];
          var idx2 = tableObject.columnIndex[i][1];
          var datatypeIdx = setupObject.featureColumns[idx1].dataColumns[idx2].datatype;

          this.dataTableColumns.push({
            prop: setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName,
            type: this.datatypes[datatypeIdx],
            id: setupObject.globalColumns[idx].columnID
          });
        }
      }

      //add rows to the table one by one
      tableObject.rowData.forEach(element => {
        var row = {};
        row["_hyperlinks"] = {};

        // fill out the row object
        for (i = 0; i < tableObject.columnIndex.length; i++) {
          // global
          if (tableObject.columnIndex[i][0] === null) {
            var idx = tableObject.columnIndex[i][1];
            var datatypeIdx = setupObject.globalColumns[idx].datatype;

            switch (this.datatypes[datatypeIdx]) {
              case "string": {
                row[setupObject.globalColumns[idx].columnFrontendName] = element[i]; break;
              }
              case "hyperlink": {
                row[setupObject.globalColumns[idx].columnFrontendName] = element[i].displayString;
                row["_hyperlinks"][setupObject.globalColumns[idx].columnFrontendName] = element[i].URL; break;
              }
              case "bool": {
                if (element[i]) {
                  row[setupObject.globalColumns[idx].columnFrontendName] = "True";
                }
                else {
                  row[setupObject.globalColumns[idx].columnFrontendName] = "False";
                } break;
              }
            }
          }
          // feature
          else {
            var idx1 = tableObject.columnIndex[i][0];
            var idx2 = tableObject.columnIndex[i][1];
            var datatypeIdx = setupObject.featureColumns[idx1].dataColumns[idx2].datatype;

            switch (this.datatypes[datatypeIdx]) {
              case "string": {
                row[setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i]; break;
              }
              case "hyperlink": {
                row[setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i].displayString;
                row["_hyperlinks"][setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = element[i].URL; break;
              }
              case "bool": {
                if (element[i]) {
                  row[setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = "True";
                }
                else {
                  row[setupObject.featureColumns[idx1].dataColumns[idx2].columnFrontendName] = "False";
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

}
