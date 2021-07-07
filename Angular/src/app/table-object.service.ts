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
    let returnableIDToItemPathArrays = this.getReturnableIDToItemPaths(setupObject, tableObject);

    // construct the column header arrays
    tableObject.returnableIDs.forEach(returnableID => {
      let columnIndex = returnableIDToColumnIndex[returnableID];
      let curColumn = setupObject.columns[columnIndex];
      let itemPath = returnableIDToItemPathArrays[returnableID].join(">");

      // let itemName be the last element of itemPath
      //get column desc
      if (curColumn.default) {
        dataTableColumns.push({
          name: curColumn.frontendName,
          type: datatypes[curColumn.datatype],
          // index: columnIndex,
          returnableID: returnableID,
          itemPath: itemPath,
          displayMetaInfo: false
        });
      }

    });

    //add rows to the table one by one
    tableObject.rowData.forEach((element, k) => {
      // console.log("hangling data for row " + k)
      newRow = {}
      newRow["_hyperlinks"] = {};

      // fill out the row object
      tableObject.returnableIDs.forEach((returnableID, i) => {
        let columnIndex = returnableIDToColumnIndex[returnableID];
        let datatype = datatypes[setupObject.columns[columnIndex].datatype];

        switch (datatype) {
          case "string": {
            newRow[returnableID] = element[i]; break;
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
      rows.push(newRow);
    });
    return rows;
  }



  getReturnableIDToItemPaths(setupObject, tableObject) {
    let returnableIDToItemPathArrays = {};
    tableObject.returnableIDs.forEach(returnableID => {
      //treeID is an array containing numbers that represent the path through the tree
      //reverse so we can pop from it like a stack
      let treeID = setupObject.returnableIDToTreeID[returnableID].split('>').reverse()
      returnableIDToItemPathArrays[returnableID] = [];
      let firstIndex = treeID.pop();
      // we have a global column
      if (firstIndex == IDX_OF_GLOBAL_ITEM_IDX) {
        returnableIDToItemPathArrays[returnableID].push("Submission");
      }
      // we have a feature column
      else if (firstIndex == IDX_OF_FEATURES_ARR) {
        let featureIndex = setupObject.children[IDX_OF_FEATURES_ARR][treeID.pop()];
        let feature = setupObject.features[featureIndex];
        returnableIDToItemPathArrays[returnableID].push(feature.frontendName);

        let childArrayIndex = treeID.pop();
        if (childArrayIndex == IDX_OF_ITEM_IDX) {
          let itemIndex = feature.children[IDX_OF_ITEM_IDX];
          returnableIDToItemPathArrays[returnableID].concat( this.getItemPathFromItem(itemIndex, treeID, setupObject));
        }
      }
    });
    return returnableIDToItemPathArrays;
  }

  private getItemPathFromItem(itemIndex, treeID, setupObject) {
    let itemNode = setupObject.items[itemIndex];
    let partialPath = [];
    partialPath.push(itemNode.frontendName)

    let childArrayIndex = treeID.pop();
    let childArrayElementIndex = treeID.pop();

    if (childArrayIndex == IDX_OF_ID_ITEM_IDXS) {
      let itemChildNodePointer = itemNode.children[IDX_OF_ID_ITEM_IDXS][childArrayElementIndex];
      partialPath.push(itemChildNodePointer.frontendName)
      partialPath.concat( this.getItemPathFromItem(itemChildNodePointer.index, treeID, setupObject))
    }
    else if (childArrayIndex == IDX_OF_NON_ID_ITEM_IDXS) {
      let itemChildNodePointer = itemNode.children[IDX_OF_NON_ID_ITEM_IDXS][childArrayElementIndex];
      partialPath.push(itemChildNodePointer.frontendName)
      partialPath.concat( this.getItemPathFromItem(itemChildNodePointer.index, treeID, setupObject))
    }

    return partialPath;
  }




  getReturnableIDToColumnIndex(setupObject, tableObject) {
    let returnableIDToColumnIndex = {};
    tableObject.returnableIDs.forEach(returnableID => {
      //treeID is an array containing numbers that represent the path through the tree
      //reverse so we can pop from it like a stack
      let treeID = setupObject.returnableIDToTreeID[returnableID].split('>').reverse()
      let firstIndex = treeID.pop();
      // we have a global column
      if (firstIndex == IDX_OF_GLOBAL_ITEM_IDX) {
        let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
        returnableIDToColumnIndex[returnableID] = this.getColumnIndexFromItem(globalItemIndex, treeID, setupObject);
      }
      // we have a feature column
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
    return returnableIDToColumnIndex;
  }

  //// returns columnIndex
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
