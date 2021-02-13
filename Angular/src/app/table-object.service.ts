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
    tableObject.returnableIDs.forEach(columnID => {
      let columnIndex = returnableIDToColumnIndex[columnID];

      dataTableColumns.push({
        prop: setupObject.columns[columnIndex].frontendName,
        type: datatypes[setupObject.columns[columnIndex].datatypeKey],
        index: columnIndex
      });
    });

    //add rows to the table one by one
    tableObject.rowData.forEach(element => {
      let row = {};
      row["_hyperlinks"] = {};


      // fill out the row object
      tableObject.returnableIDs.forEach((columnID, i) => {
        let columnIndex = returnableIDToColumnIndex[columnID];
        let datatype = datatypes[setupObject.columns[columnIndex].datatypeKey];
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

    // console.log(dataTableColumns)
    return rows;
  }

  //02200

  getReturnableIDToColumnIndex(setupObject, tableObject) {
    let returnableIDToColumnIndex = {};
    tableObject.returnableIDs.forEach(returnableID => {
      //treeID is an array containing numbers that represent the path through the tree
      //reverse so we can pop from it like a stack
      let treeID = setupObject.returnableIDToTreeID[returnableID].split('>').reverse()
      let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
      if (treeID[0] == IDX_OF_GLOBAL_ITEM_IDX) {
        let globalItem = setupObject.items[globalItemIndex];
        let childArrayIndex = treeID[1];

        if (childArrayIndex == IDX_OF_ID_COL_IDXS) {
          let columnIndex = globalItem.children[IDX_OF_ID_COL_IDXS][treeID[2]];
          returnableIDToColumnIndex[returnableID] = columnIndex;
        }
        else if (childArrayIndex == IDX_OF_ID_ITEM_IDXS) {
          let itemNode = globalItem.children[IDX_OF_ID_ITEM_IDXS][treeID[2]];
          // returnableIDToColumnIndex[returnableID] = itemNode.index;
        }
        else if (childArrayIndex == IDX_OF_NON_ID_COL_IDXS) {
          let columnIndex = globalItem.children[IDX_OF_NON_ID_COL_IDXS][treeID[2]];
          returnableIDToColumnIndex[returnableID] = columnIndex;
        }
        else if (childArrayIndex == IDX_OF_NON_ID_ITEM_IDXS) {
          let itemNode = globalItem.children[IDX_OF_NON_ID_ITEM_IDXS][treeID[2]];
          // returnableIDToColumnIndex[returnableID] = itemNode.index;
        }
      }
      else if (treeID[0] == IDX_OF_FEATURES_ARR) {
        let featureIndex = setupObject.children[IDX_OF_FEATURES_ARR][treeID[1]];
        let feature = setupObject.features[featureIndex];
        let childArrayIndex = treeID[2];
        if (childArrayIndex != IDX_OF_ITEM_IDX) {
          let columnIndex = feature.children[childArrayIndex][treeID[3]];
          returnableIDToColumnIndex[returnableID] = columnIndex;
        }
        else {
          let itemIndex = feature.children[IDX_OF_ITEM_IDX];
          let itemChildArrayIndex = treeID[4];
          // setupObject.items[itemIndex]


        }

      }
    });
    console.log("setupObject:")
    console.log(setupObject)
    console.log("returnableIDToColumnIndex:")
    console.log(returnableIDToColumnIndex)
    return returnableIDToColumnIndex;
  }

  //https://stackoverflow.com/questions/29605929/remove-first-item-of-the-array-like-popping-from-stack
  //https://stackoverflow.com/questions/6501160/why-is-pop-faster-than-shift
  //return columnIndex
  // itemChildArrayIndex, itemChildArrayElementIndex are consecutive elements in treeID array
  getColumnIndexFromItem(itemIndex, itemChildArrayIndex, itemChildArrayElementIndex, setupObject) {
    let item = setupObject.items[itemIndex];
    let childArrayIndex = itemChildArrayIndex;

    if (childArrayIndex == IDX_OF_ID_COL_IDXS) {
      return item.children[IDX_OF_ID_COL_IDXS][itemChildArrayElementIndex];
    }
    else if (childArrayIndex == IDX_OF_ID_ITEM_IDXS) {
      let itemNode = item.children[IDX_OF_ID_ITEM_IDXS][itemChildArrayElementIndex];
      // returnableIDToColumnIndex[returnableID] = itemNode.index;
    }
    else if (childArrayIndex == IDX_OF_NON_ID_COL_IDXS) {
      return item.children[IDX_OF_NON_ID_COL_IDXS][itemChildArrayElementIndex];
    }
    else if (childArrayIndex == IDX_OF_NON_ID_ITEM_IDXS) {
      let itemNode = item.children[IDX_OF_NON_ID_ITEM_IDXS][itemChildArrayElementIndex];
      // returnableIDToColumnIndex[returnableID] = itemNode.index;
    }

  }
}
