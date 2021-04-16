import { Injectable } from '@angular/core';
import {
  IDX_OF_FEATURES_ARR,
  IDX_OF_GLOBAL_ITEM_IDX,
  IDX_OF_ID_COL_IDXS,
  IDX_OF_ID_ITEM_IDXS,
  IDX_OF_NON_ID_COL_IDXS,
  IDX_OF_NON_ID_ITEM_IDXS,
  IDX_OF_OBSERVATION_COL_IDXS,
  IDX_OF_ATTRIBUTE_COL_IDXS,
  IDX_OF_ITEM_IDX,
  SetupObjectService
} from './setup-object.service'


@Injectable({
  providedIn: 'root'
})
export class TableObjectService {

  constructor(
    private setupObjectService: SetupObjectService
  ) { }


  /* ////////////////////////////////////
     getRows(setupObject, tableObject, dataTableColumns)

     params: setupObject, tableObject, dataTableColumns

     returns: rows
  */////////////////////////////////////////
  getRows(setupObject, tableObject, dataTableColumns) {
    let rows = []
    let datatypes = setupObject.datatypes;
    let newRow = {};

    // map returnable ID to columns
    let returnableIDToColumnIndex = this.getReturnableIDToColumnIndex(setupObject, tableObject);

    // construct the column header arrays
    tableObject.returnableIDs.forEach(returnableID => {
      let columnIndex = returnableIDToColumnIndex[returnableID];
      dataTableColumns.push({
        name: setupObject.columns[columnIndex].frontendName,
        type: datatypes[setupObject.columns[columnIndex].datatype],
        index: columnIndex,
        returnableID: returnableID
      });
    });

    //add rows to the table one by one
    tableObject.rowData.forEach((element, k) => {
      console.log("hangling data for row " + k)
      newRow = {}
      newRow["_hyperlinks"] = {};

      // fill out the row object
      tableObject.returnableIDs.forEach((returnableID, i) => {
        let columnIndex = returnableIDToColumnIndex[returnableID];
        let datatype = datatypes[setupObject.columns[columnIndex].datatype];

        switch (datatype) {
          case "string": {
            newRow[returnableID] = element[i];
            // if (setupObject.columns[columnIndex].frontendName == "User Email") {
            //   console.log(returnableID + " " + columnIndex + " " + newRow[columnIndex])
            //   // console.log(setupObject.columns[columnIndex].frontendName + " " + datatype + " " + element[i])
            // }
            break;
          }
          case "hyperlink": {
            // newRow[setupObject.columns[columnIndex].frontendName] = element[i].displayString;
            // newRow["_hyperlinks"][columnIndex] = element[i].URL; break;
            newRow[returnableID] = element[i];
            newRow["_hyperlinks"][returnableID] = element[i]; break;
          }
          case "bool": {
            if (element[i]) {
              newRow[returnableID] = "True";
            }
            else {
              newRow[returnableID] = "False";
            } break;
          }
          case "date": {
            newRow[returnableID] = element[i]; break;
          }
        }
      });
      // console.log(newRow)
      rows.push(newRow);
    });
    // console.log("setupObject:")
    // console.log(setupObject)
    // console.log("dataTableColumns:")
    // console.log(dataTableColumns)
    console.log("rows:")
    console.log(rows)
    return rows;
  }

  //02200

  getReturnableIDToColumnIndex(setupObject, tableObject) {
    let returnableIDToColumnIndex = {};
    tableObject.returnableIDs.forEach(returnableID => {
      //treeID is an array containing numbers that represent the path through the tree
      //reverse so we can pop from it like a stack
      let treeID = setupObject.returnableIDToTreeID[returnableID].split('>').reverse()
      let firstIndex = treeID.pop();
      if (firstIndex == IDX_OF_GLOBAL_ITEM_IDX) {
        let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
        returnableIDToColumnIndex[returnableID] = this.getColumnIndexFromItem(globalItemIndex, treeID, setupObject);
      }
      else if (firstIndex == IDX_OF_FEATURES_ARR) {
        let featureIndex = setupObject.children[IDX_OF_FEATURES_ARR][treeID.pop()];
        let feature = setupObject.features[featureIndex];
        let childArrayIndex = treeID.pop();
        if (childArrayIndex != IDX_OF_ITEM_IDX) {
          returnableIDToColumnIndex[returnableID] = feature.children[childArrayIndex][treeID.pop()];
        }
        else {
          let itemIndex = feature.children[IDX_OF_ITEM_IDX];
          returnableIDToColumnIndex[returnableID] = this.getColumnIndexFromItem(itemIndex, treeID, setupObject);
        }
      }
    });

    // console.log("returnableIDToColumnIndex:")
    // console.log(returnableIDToColumnIndex)
    return returnableIDToColumnIndex;
  }

  //https://stackoverflow.com/questions/29605929/remove-first-item-of-the-array-like-popping-from-stack

  // returns columnIndex
  private getColumnIndexFromItem(itemIndex, treeID, setupObject) {
    let itemNode = setupObject.items[itemIndex];
    let childArrayIndex = treeID.pop();
    let childArrayElementIndex = treeID.pop();

    if (childArrayIndex == IDX_OF_ID_COL_IDXS) {
      return itemNode.children[IDX_OF_ID_COL_IDXS][childArrayElementIndex];
    }
    else if (childArrayIndex == IDX_OF_ID_ITEM_IDXS) {
      let itemChildNodePointer = itemNode.children[IDX_OF_ID_ITEM_IDXS][childArrayElementIndex];
      return this.getColumnIndexFromItem(itemChildNodePointer.index, treeID, setupObject)
    }
    else if (childArrayIndex == IDX_OF_NON_ID_COL_IDXS) {
      return itemNode.children[IDX_OF_NON_ID_COL_IDXS][childArrayElementIndex];
    }
    else if (childArrayIndex == IDX_OF_NON_ID_ITEM_IDXS) {
      let itemChildNodePointer = itemNode.children[IDX_OF_NON_ID_ITEM_IDXS][childArrayElementIndex];
      return this.getColumnIndexFromItem(itemChildNodePointer.index, treeID, setupObject)
    }
  }


}
