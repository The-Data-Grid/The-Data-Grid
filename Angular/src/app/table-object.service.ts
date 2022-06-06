import { Injectable } from '@angular/core';
import {
  IDX_OF_FEATURES_ARR,
  IDX_OF_ITEM_ARR,
  IDX_OF_GLOBAL_ITEM_IDX,
  IDX_OF_AUDIT_ITEM_IDX,
  IDX_OF_ID_COL_IDXS,
  IDX_OF_ID_ITEM_IDXS,
  IDX_OF_NON_ID_COL_IDXS,
  IDX_OF_NON_ID_ITEM_IDXS,
  IDX_OF_ITEM_ATTRIBUTE_IDXS,
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

     params: setupObject, 
            tableObject, 
            dataTableColumns: initially empty array, this function fills it with 
                              objects, each object containing info related to one column

     returns: an array of objects in which each object is a row
  */////////////////////////////////////////
  getRows(setupObject, tableObject, dataTableColumns) {
    let rows = []
    let datatypes = setupObject.datatypes;
    let newRow = {};

    // Map returnable ID to columns
    let returnableIDToColumnIndex = this.getReturnableIDToColumnIndex(setupObject, tableObject);
    let returnableIDToItemPathArrays = this.getReturnableIDToItemPaths(setupObject, tableObject);

    // Construct the column header arrays
    tableObject.returnableIDs.forEach(returnableID => {
      let columnIndex = returnableIDToColumnIndex[returnableID];
      let curColumn = setupObject.columns[columnIndex];
      let itemPath = returnableIDToItemPathArrays[returnableID].join(">");

      // console.log(curColumn)

      // let itemName be the last element of itemPath
      // get column desc
      if (curColumn.default) {
        dataTableColumns.push({
          name: curColumn.frontendName,
          type: datatypes[curColumn.datatypeKey],
          returnableID: returnableID,
          itemPath: itemPath,
          displayMetaInfo: false
        });
      }
    });

    // Add rows to the table one by one
    tableObject.rowData.forEach((element, k) => {
      // console.log("handling data for row " + k)
      newRow = {}
      newRow["_hyperlinks"] = {};

      // fill out the row object
      tableObject.returnableIDs.forEach((returnableID, i) => {
        let columnIndex = returnableIDToColumnIndex[returnableID];
        let datatype = datatypes[setupObject.columns[columnIndex].datatypeKey];

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
      let treeID = setupObject.returnableIDToTreeID[returnableID].split('>');
      treeID.reverse();
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
          returnableIDToItemPathArrays[returnableID].concat(this.getItemPathFromItem(itemIndex, treeID, setupObject));
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
      partialPath.concat(this.getItemPathFromItem(itemChildNodePointer.index, treeID, setupObject))
    }
    else if (childArrayIndex == IDX_OF_NON_ID_ITEM_IDXS) {
      let itemChildNodePointer = itemNode.children[IDX_OF_NON_ID_ITEM_IDXS][childArrayElementIndex];
      partialPath.push(itemChildNodePointer.frontendName)
      partialPath.concat(this.getItemPathFromItem(itemChildNodePointer.index, treeID, setupObject))
    }

    return partialPath;
  }

  getReturnableIDToColumnIndex(setupObject, returnableIDs) {
    let returnableIDToColumnIndex = {};
    returnableIDs.forEach(returnableID => {
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
      else if (firstIndex == IDX_OF_ITEM_ARR) {
        let itemIndex = setupObject.children[IDX_OF_ITEM_ARR][treeID.pop()];
        returnableIDToColumnIndex[returnableID] = this.getColumnIndexFromItem(itemIndex, treeID, setupObject);
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
