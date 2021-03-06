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

    // map returnable ID to columns
    let returnableIDToColumnIndex = this.getReturnableIDToColumnIndex(setupObject, tableObject);

    // construct the column header arrays
    tableObject.returnableIDs.forEach(returnableID => {
      let columnIndex = returnableIDToColumnIndex[returnableID];
      dataTableColumns.push({
        prop: setupObject.columns[columnIndex].frontendName,
        type: datatypes[setupObject.columns[columnIndex].datatype],
        index: columnIndex
      });
    });

    //add rows to the table one by one
    tableObject.rowData.forEach(element => {
      let row = {};
      row["_hyperlinks"] = {};


      // fill out the row object
      tableObject.returnableIDs.forEach((returnableID, i) => {
        let columnIndex = returnableIDToColumnIndex[returnableID];
        let datatype = datatypes[setupObject.columns[columnIndex].datatype];
        // console.log(setupObject.columns[columnIndex].frontendName + " " + datatype)

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
    // console.log("setupObject:")
    // console.log(setupObject)
    console.log("dataTableColumns:")
    console.log(dataTableColumns)
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
