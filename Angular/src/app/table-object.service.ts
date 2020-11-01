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


  /* ////////////////////////////////////
     getTableInfo(setupObject, tableObject, dataTableColumns)

     params: setupObject, tableObject, dataTableColumns

     returns: rows
  */////////////////////////////////////////
  getRows(setupObject, tableObject, dataTableColumns) {
    let rows = []

    // map returnable ID to columns
    let returnableIDToColumnIndex = this.getReturnableIDToColumnIndex(setupObject, tableObject);

    // construct the column header arrays
    tableObject.returnableColumnIDs.forEach(columnID => {
      let columnIndex = returnableIDToColumnIndex[columnID];

      dataTableColumns.push({
        prop: setupObject.columns[columnIndex].frontendName,
        // TODO: datatype is hardcoded as string here
        type: 'string',
        index: columnIndex
      });
    });

    //add rows to the table one by one
    tableObject.rowData.forEach(element => {
      let row = {};
      row["_hyperlinks"] = {};

      // TODO: DATA tpye is hardecoded as string
      let datatype = 'string';

      // fill out the row object
      tableObject.returnableColumnIDs.forEach((columnID, i) => {
        let columnIndex = returnableIDToColumnIndex[columnID];
        switch (datatype) {
          case "string": {
            row[setupObject.columns[columnIndex].frontendName] = element[i]; break;
          }
          case "hyperlink": {
            row[setupObject.columns[columnIndex].frontendName] = element[i].displayString;
            row["_hyperlinks"][columnIndex] = element[i].URL; break;
          }
          case "bool": {
            if (element[i]) {
              row[setupObject.columns[columnIndex].frontendName] = "True";
            }
            else {
              row[setupObject.columns[columnIndex].frontendName] = "False";
            } break;
          }
        }
      });

      rows.push(row);
    });

    console.log(dataTableColumns)
    return rows;
  }

  getReturnableIDToColumnIndex(setupObject, tableObject) {
    let returnableIDToColumnIndex = {};
    tableObject.returnableColumnIDs.forEach(columnID => {
      let treeID = setupObject.returnableIDToTreeID[columnID].split('>')
      let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
      //need column name, type, and index

      if (treeID[0] == IDX_OF_GLOBAL_ITEM_IDX) {
        let globalItem = setupObject.items[globalItemIndex];
        let childArrayIndex = treeID[1];
        if (childArrayIndex == IDX_OF_ID_COL_IDXS) {
          let columnIndex = globalItem.children[IDX_OF_ID_COL_IDXS][treeID[2]];
          returnableIDToColumnIndex[columnID] = columnIndex;
        }
        // TODO: go into children[1], the itemnodepointerchild array thing
      }
      else if (treeID[0] == IDX_OF_FEATURES_ARR) {
        let featureIndex = setupObject.children[IDX_OF_FEATURES_ARR][treeID[1]];
        let feature = setupObject.features[featureIndex];
        let childArrayIndex = treeID[2];
        let columnIndex = feature.children[childArrayIndex][treeID[3]];
        returnableIDToColumnIndex[columnID] = columnIndex;
      }
    });
    console.log(returnableIDToColumnIndex)
    return returnableIDToColumnIndex;
  }

}
