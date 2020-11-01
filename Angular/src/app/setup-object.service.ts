import { Injectable } from '@angular/core';

export const IDX_OF_FEATURES_ARR = 0;
export const IDX_OF_GLOBAL_ITEM_IDX = 1;
export const IDX_OF_ID_COL_IDXS = 0;
export const IDX_OF_OBSERVATION_COL_IDXS = 0;
export const IDX_OF_ATTRIBUTE_COL_IDXS = 1;

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

  getGlobalSelectors(setupObject, appliedFilterSelections, defaultColumns) {
    let globalItemIndex = setupObject.children[IDX_OF_GLOBAL_ITEM_IDX];
    let globalColumns = [];
    // look at global IDColumns 
    setupObject.items[globalItemIndex].children[IDX_OF_ID_COL_IDXS].forEach((IDColumnIndex, i) => {
      console.log(setupObject);
      globalColumns.push({
        column: setupObject.columns[IDColumnIndex],
        returnableID: this.getReturnableID([IDX_OF_GLOBAL_ITEM_IDX, IDX_OF_ID_COL_IDXS, i], setupObject)
      });
    });
    return this.parseColumns(globalColumns, appliedFilterSelections, defaultColumns);
  }

  getFeatureSelectors(setupObject, appliedFilterSelections, defaultColumns) {
    let allFeatureSelectors = [];
    // for each feature
    setupObject.children[IDX_OF_FEATURES_ARR].forEach((featureIndex, k) => {
      let featureColumns = [];
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
      // allFeatureSelectors[setupObject.features[featureIndex].frontendName] = this.parseColumns(featureColumns,
      allFeatureSelectors[k] = this.parseColumns(featureColumns,
        appliedFilterSelections,
        defaultColumns);
    });
    return allFeatureSelectors;
  }



  private getReturnableID(tree: any[], setupObject): string {
    let treeID = tree.join('>');
    return setupObject.treeIDToReturnableID[treeID];
  }

  private parseColumns(infos, appliedFilterSelections, defaultColumns): any {
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
        appliedFilterSelections[info.returnableID] = null;

        switch (info.column.filterSelector.selectorKey) {
          case "dropdown": { selectors.dropdown.push(info); break; }
          case "numericChoice": { selectors.numericChoice.push(info); break; }
          case "numericEqual": {
            selectors.numericEqual.push(info);
            appliedFilterSelections[info.returnableID] = { relation: null, input: null }; break;
          }
          case "calendarRange": {
            selectors.calendarRange.push(info);
            appliedFilterSelections[info.returnableID] = { start: null, end: null }; break;
          }
          case "calendarEqual": { selectors.calendarEqual.push(info); break; }
          case "searchableDropdown": {
            selectors.searchableDropdown.push(info);
            appliedFilterSelections[info.returnableID] = []; break;
          }
          case "checklistDropdown": {
            selectors.checklistDropdown.push(info);
            appliedFilterSelections[info.returnableID] = []; break;
          }
          case "searchableChecklistDropdown": {
            selectors.searchableChecklistDropdown.push(info);
            appliedFilterSelections[info.returnableID] = []; break;
          }
          case "text": { selectors.text.push(info); break; }
          case "bool": { selectors.bool.push(info); break; }
        }
      }
      if (info.column.default) {
        defaultColumns.push(info.column.returnableID);
      }
    });
    return selectors;
  }
}
