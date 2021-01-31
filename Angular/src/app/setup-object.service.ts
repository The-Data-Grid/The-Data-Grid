import { Injectable } from '@angular/core';
import { AppliedFilterSelections} from './models'

export const IDX_OF_FEATURES_ARR = 0;
export const IDX_OF_GLOBAL_ITEM_IDX = 1;

export const IDX_OF_ID_COL_IDXS = 0;
export const IDX_OF_ID_ITEM_IDXS = 1;
export const IDX_OF_NON_ID_COL_IDXS = 2;
export const IDX_OF_NON_ID_ITEM_IDXS = 3;

export const IDX_OF_OBSERVATION_COL_IDXS = 0;
export const IDX_OF_ATTRIBUTE_COL_IDXS = 1;
export const IDX_OF_ITEM_IDX = 2;

@Injectable({
  providedIn: 'root'
})
export class SetupObjectService {

  constructor() { }

  /* ////////////////////////////////////
     getRootFeatures(setupObject)

     params: setupObject

     returns: array containing objects with the following format:
        {
          name: string,   //feature name
          index: number                           //index in setupObject's 'features' array
        }
  */////////////////////////////////////////
  getRootFeatures(setupObject) {
    let rootFeatures = []
    for (let j = 0; j < setupObject.subfeatureStartIndex; j++) {
      rootFeatures.push({
        name: setupObject.features[setupObject.children[IDX_OF_FEATURES_ARR][j]].frontendName,
        index: j
      });
    }
    return rootFeatures;
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



//recursively find all the columns belonging to an item or a child of that item
  private getAllItemRelatedColumns(item, columns, path, setupObject) {
    item.children[IDX_OF_ID_COL_IDXS].forEach((IDColumnIndex, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_ID_COL_IDXS, i);
      columns.push({
        column: setupObject.columns[IDColumnIndex],
        returnableID: this.getReturnableID(newPath, setupObject)
      });
    });
    item.children[IDX_OF_ID_ITEM_IDXS].forEach((itemPointer, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_ID_ITEM_IDXS, i);
      console.log(itemPointer.index + " ID " + itemPointer.frontendName)
      let itemIndex = itemPointer.index;
      this.getAllItemRelatedColumns(setupObject.items[itemIndex], columns, newPath, setupObject);
    });
    item.children[IDX_OF_NON_ID_COL_IDXS].forEach((NonIDColumnIndex, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_NON_ID_COL_IDXS, i);
      columns.push({
        column: setupObject.columns[NonIDColumnIndex],
        returnableID: this.getReturnableID(newPath, setupObject)
      });
    });
    item.children[IDX_OF_NON_ID_ITEM_IDXS].forEach((itemPointer, i) => {
      let newPath = Object.assign([], path);
      newPath.push(IDX_OF_NON_ID_ITEM_IDXS, i);
      console.log(itemPointer.index + " NON id " + itemPointer.frontendName)
      let itemIndex = itemPointer.index;
      this.getAllItemRelatedColumns(setupObject.items[itemIndex], columns, newPath, setupObject);
    });
  }

   /* ////////////////////////////////////
    getGlobalSelectors(setupObject, appliedFilterSelections, defaultColumnIDs)

    params: -setupObject
            -appliedFilterSelections: an object that will hold's a user's input for each selector
            -defaultColumnIDs: array of returnableIDs for all the columns that have default marked true
            -wantFeatureSelector: boolean indicates whether we want to return filterSelectors or inputSelectors

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

    where each element inside the arrays have the form:
    {
        column: columnObject
        returnableID: column's returnableID
    }
 */////////////////////////////////////////
 getGlobalSelectors(setupObject, appliedFilterSelections: AppliedFilterSelections, defaultColumnIDs, wantFeatureSelector: boolean) {
  let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
  let globalColumns = [];
  let path = [IDX_OF_GLOBAL_ITEM_IDX];

  this.getAllItemRelatedColumns(setupObject.items[globalItemIndex], globalColumns, path, setupObject);

  return this.parseColumns(globalColumns, appliedFilterSelections, defaultColumnIDs, wantFeatureSelector);
}


   /* ////////////////////////////////////
    getFeatureSelectors(setupObject, appliedFilterSelections, defaultColumnIDs)

    params: -setupObject
            -appliedFilterSelections: an object that will hold's a user's input for each selector
            -defaultColumnIDs: array of returnableIDs for all the columns that have default marked true

    returns: an array of selector objects. each element of this array contains the selectors belonging to
             one feature, and its index is the same as the index of that feature in the setupObject features array. 
             see getGlobalSelectors for an example of a selector object.

 */////////////////////////////////////////
  getFeatureSelectors(setupObject, appliedFilterSelections: AppliedFilterSelections, defaultColumnIDs) {
    let allFeatureSelectors = [];
    // for each feature
    setupObject.children[IDX_OF_FEATURES_ARR].forEach((featureIndex, k) => {
      let featureColumns = [];
      // console.log(setupObject.features[featureIndex].frontendName)
      // find feature's observation columns
      setupObject.features[featureIndex].children[IDX_OF_OBSERVATION_COL_IDXS].forEach((observationColumnIndex, i) => {
        featureColumns.push({
          column: setupObject.columns[observationColumnIndex],
          returnableID: this.getReturnableID([IDX_OF_FEATURES_ARR, k, IDX_OF_OBSERVATION_COL_IDXS, i], setupObject)
        });
      });
      // find feature's attribute columns
      setupObject.features[featureIndex].children[IDX_OF_ATTRIBUTE_COL_IDXS].forEach((attributeColumnIndex, i) => {
        featureColumns.push({
          column: setupObject.columns[attributeColumnIndex],
          returnableID: this.getReturnableID([IDX_OF_FEATURES_ARR, k, IDX_OF_ATTRIBUTE_COL_IDXS, i], setupObject)
        });
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
    // for each feature
    setupObject.children[IDX_OF_FEATURES_ARR].forEach((featureIndex, k) => {
      let featureColumns = [];
      // console.log(childType + " " + setupObject.features[featureIndex].frontendName)
      // find feature's observation or attribute columns
      setupObject.features[featureIndex].children[childType].forEach((columnIndex, i) => {
        featureColumns.push({
          column: setupObject.columns[columnIndex],
          returnableID: this.getReturnableID([IDX_OF_FEATURES_ARR, k, childType, i], setupObject)
        });
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
  //wantFeatureSelector indicates whether we want to return filterSelectors or inputSelectors
  private parseColumns(infos, appliedFilterSelections: AppliedFilterSelections , defaultColumnIDs, wantFeatureSelector: boolean): any {
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

    infos.forEach(info => {
      wantFeatureSelector ? curColumnSelector = info.column.filterSelector : curColumnSelector = info.column.inputSelector;
      if (curColumnSelector) {
        switch (curColumnSelector.selectorKey) {
          case "dropdown": {
            selectors.dropdown.push(info);
            appliedFilterSelections.dropdown[info.returnableID] = null; break;
          }
          case "numericEqual": {
            selectors.numericEqual.push(info);
            appliedFilterSelections.numericEqual[info.returnableID] = null; break;
          }
          case "numericChoice": {
            selectors.numericChoice.push(info);
            appliedFilterSelections.numericChoice[info.returnableID] = { relation: null, value: null }; break;
          }
          case "calendarRange": {
            selectors.calendarRange.push(info);
            appliedFilterSelections.calendarRange[info.returnableID] = { start: null, end: null }; break;
          }
          case "calendarEqual": {
            selectors.calendarEqual.push(info);
            appliedFilterSelections.calendarEqual[info.returnableID] = null; break;
          }
          case "searchablenumericEqual": {
            selectors.searchableDropdown.push(info);
            appliedFilterSelections.searchableDropdown[info.returnableID] = []; break;
          }
          case "checklistDropdown": {
            selectors.checklistDropdown.push(info);
            appliedFilterSelections.checklistDropdown[info.returnableID] = []; break;
          }
          case "searchableChecklistDropdown": {
            selectors.searchableChecklistDropdown.push(info);
            appliedFilterSelections.searchableChecklistDropdown[info.returnableID] = []; break;
          }
          case "text": {
            selectors.text.push(info);
            appliedFilterSelections.text[info.returnableID] = null; break;
          }
          case "bool": {
            selectors.bool.push(info);
            appliedFilterSelections.bool[info.returnableID] = null; break;
          }
        }
      }
      if (info.column.default) {
        defaultColumnIDs.push(info.returnableID);
      }
    });
    return selectors;
  }
}
