import { Injectable } from '@angular/core';
import { AppliedFilterSelections, ReturnableIDObject} from './models'

// setupObject.children
export const IDX_OF_FEATURES_ARR = 0;
export const IDX_OF_ITEM_ARR = 1;
export const IDX_OF_GLOBAL_ITEM_IDX = 2;
export const IDX_OF_AUDIT_ITEM_IDX = 3;

export const IDX_OF_ID_COL_IDXS = 0;
export const IDX_OF_ID_ITEM_IDXS = 1;
export const IDX_OF_NON_ID_COL_IDXS = 2;
export const IDX_OF_NON_ID_ITEM_IDXS = 3;

export const IDX_OF_OBSERVATION_COL_IDXS = 0;
export const IDX_OF_ATTRIBUTE_COL_IDXS = 1;
export const IDX_OF_ITEM_IDX = 2;  //subject to change when backend implements api

@Injectable({
  providedIn: 'root'
})
export class SetupObjectService {

  constructor() { }

  /* ////////////////////////////////////
     getRootFeatures(setupObject)

     description: extract root feature name and featureIndex from setupObject
     params: setupObject
     returns: array containing objects with the following format:
        {
          name: string,   //feature name
          index: number                           //index in setupObject's 'features' array
        }
  */////////////////////////////////////////
  getRootFeatures(setupObject) {
    let rootFeatures = []
    for (let j = 0; j < setupObject.features.length; j++) {
      rootFeatures.push({
        name: setupObject.features[setupObject.children[IDX_OF_FEATURES_ARR][j]].frontendName,
        index: j
      });
    }
    return rootFeatures;
  }

    /* ////////////////////////////////////
     getFeatureReturnableIDs(setupObject, featureIndex)

     description: gets an array of column returnable IDS for a given feature
     params: setupObject, 
             featureIndex: the index of the setupObject 'feaures' array for the feature we are interested in
     returns: array of numbers (returnableIDS)
  */////////////////////////////////////////
  getFeatureReturnableIDs(setupObject, featureIndex) {
      let returnableIDs = [];
      let ID = null;
      
      let indexOfFeatureIndex = setupObject.children[IDX_OF_FEATURES_ARR].indexOf(featureIndex);
      // ...find feature's observation columns
      setupObject.features[featureIndex].children[IDX_OF_OBSERVATION_COL_IDXS].forEach((observationColumnIndex, i) => {
        ID = this.getReturnableID([IDX_OF_FEATURES_ARR, indexOfFeatureIndex, IDX_OF_OBSERVATION_COL_IDXS, i], setupObject);
        if (ID) {
          returnableIDs.push(ID);
        }
        else {
          console.log("undefined returnable ID for observation column:" + i)
        }
      });
      // ...find feature's attribute columns
      setupObject.features[featureIndex].children[IDX_OF_ATTRIBUTE_COL_IDXS].forEach((attributeColumnIndex, i) => {
        ID = this.getReturnableID([IDX_OF_FEATURES_ARR, indexOfFeatureIndex, IDX_OF_ATTRIBUTE_COL_IDXS, i], setupObject);
        if (ID) {
          returnableIDs.push(ID);
        }
        else {
          console.log("undefined returnable ID for attribute column:" + i)
        }
      });
      return returnableIDs;
  }

  /* ////////////////////////////////////
    getFeaturesToChildren(setupObject)

    params: setupObject

    returns: object that maps a feature's index in the setupObject 
      'features' array to the feature's subfeature indices. example:
       {
         1: [2,3,4],   //feature 1 has subfeatures 2, 3, and 4
       }
 */////////////////////////////////////////
  getFeaturesToChildren(setupObject) {
    let featuresToChildren = {}
    setupObject.features.forEach((feature, index) => {
      // map index to the feature's children
      featuresToChildren[index] = feature.featureChildren;
    });
    return featuresToChildren;
  }

  getAllAuditItemRelatedColumns(setupObject) {
    const columns = []
    this.getAllItemRelatedColumns(setupObject, setupObject.items[IDX_OF_GLOBAL_ITEM_IDX], columns)
    return columns;
  }

//recursively find all the columns belonging to an item or a child of that item
  private getAllItemRelatedColumns(setupObject, item, columns, path = [], returnableIDs = []) {
    item.children[IDX_OF_ID_COL_IDXS].forEach((IDColumnIndex, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_ID_COL_IDXS, i);
      let curColumn = setupObject.columns[IDColumnIndex];
      curColumn["_returnableID"] = this.getReturnableID(newPath, setupObject);
      columns.push(curColumn);
      returnableIDs.push(this.getReturnableID(newPath, setupObject));
    });
    item.children[IDX_OF_ID_ITEM_IDXS].forEach((itemPointer, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_ID_ITEM_IDXS, i);
      let itemIndex = itemPointer.index;
      this.getAllItemRelatedColumns(setupObject, setupObject.items[itemIndex], columns, newPath, returnableIDs);
    });
    item.children[IDX_OF_NON_ID_COL_IDXS].forEach((NonIDColumnIndex, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_NON_ID_COL_IDXS, i);
      let curColumn = setupObject.columns[NonIDColumnIndex];
      curColumn["_returnableID"] = this.getReturnableID(newPath, setupObject);
      columns.push(curColumn);
      returnableIDs.push(this.getReturnableID(newPath, setupObject));
    });
    item.children[IDX_OF_NON_ID_ITEM_IDXS].forEach((itemPointer, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_NON_ID_ITEM_IDXS, i);
      let itemIndex = itemPointer.index;
      this.getAllItemRelatedColumns(setupObject, setupObject.items[itemIndex], columns, newPath, returnableIDs);
    });
  }

   /* ////////////////////////////////////
    getGlobalSelectors(setupObject, appliedFilterSelections, defaultColumnIDs)

    params: -setupObject
            -appliedFilterSelections: an object that will hold's a user's input for each selector
            -defaultColumnIDs: array of returnableIDs for all the columns that have default marked true
            -wantFilterSelector: boolean indicates whether we want to return filterSelectors or inputSelectors

    returns: selector object that maps selector type to column information. 
    selector object format:
    {
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

    where each element inside the arrays is a columnObject
 */////////////////////////////////////////
 getGlobalSelectors(setupObject, appliedFilterSelections: AppliedFilterSelections, defaultColumnIDs, returnableIDs, wantFilterSelector: boolean) {
  let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
  let globalColumns = [];
  let path = [IDX_OF_GLOBAL_ITEM_IDX];

  this.getAllItemRelatedColumns(setupObject, setupObject.items[globalItemIndex], globalColumns, path, returnableIDs);
  return this.parseColumns(globalColumns, appliedFilterSelections, defaultColumnIDs, wantFilterSelector);
}


   /* ////////////////////////////////////
    getFeatureFilterSelectors(setupObject, appliedFilterSelections, defaultColumnIDs)

    params: -setupObject
            -appliedFilterSelections: an object that will hold's a user's input for each selector
            -defaultColumnIDs: array of returnableIDs for all the columns that have default marked true

    returns: an array of selector objects. each element of this array contains the selectors belonging to
             one feature, and its index is the same as the index of that feature in the setupObject features array. 
             see getGlobalSelectors for an example of a selector object.

 */////////////////////////////////////////
  getFeatureFilterSelectors(setupObject, appliedFilterSelections: AppliedFilterSelections, defaultColumnIDs) {
    let allFeatureSelectors = [];
    // for each feature...
    setupObject.children[IDX_OF_FEATURES_ARR].forEach((featureIndex, k) => {
      let featureColumns = [];
      // console.log(setupObject.features[featureIndex].frontendName + " " + featureIndex)
      // ...find feature's observation columns
      setupObject.features[featureIndex].children[IDX_OF_OBSERVATION_COL_IDXS].forEach((observationColumnIndex, i) => {
        let curColumn = setupObject.columns[observationColumnIndex];
        curColumn["_returnableID"] = this.getReturnableID([IDX_OF_FEATURES_ARR, k, IDX_OF_OBSERVATION_COL_IDXS, i], setupObject);
        featureColumns.push(curColumn);
      });
      // ...find feature's attribute columns
      setupObject.features[featureIndex].children[IDX_OF_ATTRIBUTE_COL_IDXS].forEach((attributeColumnIndex, i) => {
        let curColumn = setupObject.columns[attributeColumnIndex];
        curColumn["_returnableID"] = this.getReturnableID([IDX_OF_FEATURES_ARR, k, IDX_OF_ATTRIBUTE_COL_IDXS, i], setupObject)
        featureColumns.push(curColumn);
      });
      allFeatureSelectors[featureIndex] = this.parseColumns(featureColumns,
        appliedFilterSelections,
        defaultColumnIDs,
        true);
    });
    return allFeatureSelectors;
  }


 /* ////////////////////////////////////
    getFeatureInputSelectors(setupObject, appliedFilterSelections, defaultColumnIDs, isObservation: boolean)

    params: -setupObject
            -appliedFilterSelections: an object that will hold's a user's input for each selector
            -defaultColumnIDs: array of returnableIDs for all the columns that have default marked true
            -isObservation: set to true to get observation selectors, false to get attribute selectors

    returns: an array of selector objects. 
             each element of this array contains the observation selectors or attribute selectors belonging to
             one feature, and its index is the same as the index of that feature in the setupObject features array. 
             see getGlobalSelectors for an example of a selector object.

 */////////////////////////////////////////

  // returns an array that holds key-value mapping from feature's index in setupObj features array 
  // to its input selectors
  getFeatureInputSelectors(setupObject, appliedFilterSelections: AppliedFilterSelections, 
    defaultColumnIDs, isObservation: boolean) {
    let childType;
    isObservation ? childType = IDX_OF_OBSERVATION_COL_IDXS : childType = IDX_OF_ATTRIBUTE_COL_IDXS;

    let allFeatureInputSelectors = [];
    // for each feature...
    setupObject.children[IDX_OF_FEATURES_ARR].forEach((featureIndex, k) => {
      let featureColumns = [];
      // ...find feature's observation or attribute columns
      setupObject.features[featureIndex].children[childType].forEach((columnIndex, i) => {
        let curColumn = setupObject.columns[columnIndex];
        curColumn["_returnableID"] = this.getReturnableID([IDX_OF_FEATURES_ARR, k, childType, i], setupObject)
        featureColumns.push(curColumn);
      });
      allFeatureInputSelectors[featureIndex] = this.parseColumns(featureColumns,
        appliedFilterSelections,
        defaultColumnIDs,
        false);
    });
    return allFeatureInputSelectors;
  }


  /* ////////////////////////////////////
    getFeatureItemChildren(setupObject, featureIndex)

    params: 
      setupObject, 
      featureIndex: the feature's index of the setupObject.features array

    returns: array of the feature's item children. each element is an itemChildNodePointerObject
    see api spec for more info on itemChildNodePointerObject.
 */////////////////////////////////////////
  getFeatureItemChildren(setupObject, featureIndex) {
    let itemIndex = setupObject.features[featureIndex].children[IDX_OF_ITEM_IDX];
    return setupObject.items[itemIndex].children[IDX_OF_ID_ITEM_IDXS];
  }

  private getReturnableID(tree: any[], setupObject): string {
    let treeID = tree.join('>');
    return setupObject.treeIDToReturnableID[treeID];
  }

  // create the appliedFilterSelections object by finding all selectors. 
  // also find all columns that have default marked true
  //fills defaultcolumnIDs with the IDs of default columns
  //wantFilterSelector indicates whether we want to return filterSelectors or inputSelectors
  private parseColumns(columns, appliedFilterSelections: AppliedFilterSelections , defaultColumnIDs, wantFilterSelector: boolean): any {
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
      bool: [],
      _placeholder: "placeholder"
    };

    let curColumnSelector = null;

    columns.forEach(column => {
      wantFilterSelector ? curColumnSelector = column.filterSelector : curColumnSelector = column.inputSelector;
      if (curColumnSelector) {
        switch (curColumnSelector.selectorKey) {
          case "dropdown": {
            selectors.dropdown.push(column);
            appliedFilterSelections.dropdown[column._returnableID] = null; break;
          }
          case "numericEqual": {
            selectors.numericEqual.push(column);
            appliedFilterSelections.numericEqual[column._returnableID] = null; break;
          }
          case "numericChoice": {
            selectors.numericChoice.push(column);
            appliedFilterSelections.numericChoice[column._returnableID] = { relation: null, value: null }; break;
          }
          case "calendarRange": {
            selectors.calendarRange.push(column);
            appliedFilterSelections.calendarRange[column._returnableID] = { start: null, end: null }; break;
          }
          case "calendarEqual": {
            selectors.calendarEqual.push(column);
            appliedFilterSelections.calendarEqual[column._returnableID] = null; break;
          }
          case "searchableDropdown": {
            selectors.searchableDropdown.push(column);
            appliedFilterSelections.searchableDropdown[column._returnableID] = []; break;
          }
          case "checklistDropdown": {
            selectors.checklistDropdown.push(column);
            appliedFilterSelections.checklistDropdown[column._returnableID] = []; break;
          }
          case "searchableChecklistDropdown": {
            selectors.searchableChecklistDropdown.push(column);
            appliedFilterSelections.searchableChecklistDropdown[column._returnableID] = []; break;
          }
          case "text": {
            selectors.text.push(column);
            appliedFilterSelections.text[column._returnableID] = null; break;
          }
          case "bool": {
            selectors.bool.push(column);
            appliedFilterSelections.bool[column._returnableID] = null; break;
          }
        }
      }
      if (column.default) {
        defaultColumnIDs.push(column._returnableID);
      }
    });
    return selectors;
  }
}
