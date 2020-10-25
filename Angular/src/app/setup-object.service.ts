import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SetupObjectService {

  IDX_OF_FEATURES_ARR = 0;
  IDX_OF_GLOBAL_ITEM_IDX = 1;
  IDX_OF_ID_COL_IDXS = 0;
  IDX_OF_OBSERVATION_COL_IDXS = 0;
  IDX_OF_ATTRIBUTE_COL_IDXS = 1;

  constructor() { }

  getRootFeatures(setupObject) {
    let rootFeatures = []
    for (let j = 0; j < setupObject.subfeatureStartIndex; j++) {
      rootFeatures.push(setupObject.features[setupObject.children[this.IDX_OF_FEATURES_ARR][j]]);
    }
    return rootFeatures;
  }

  getGlobalSelectors(setupObject, appliedFilterSelections, defaultColumns) {
    let globalItemIndex = setupObject.children[this.IDX_OF_GLOBAL_ITEM_IDX];
    let globalColumns = [];
    // look at global IDColumns 
    setupObject.items[globalItemIndex].children[this.IDX_OF_ID_COL_IDXS].forEach((IDColumnIndex, i) => {
      console.log(setupObject);
      globalColumns.push({
        column: setupObject.columns[IDColumnIndex],
        returnableID: this.getReturnableID([this.IDX_OF_GLOBAL_ITEM_IDX, this.IDX_OF_ID_COL_IDXS, i], setupObject)
      });
    });
    return this.parseColumns(globalColumns, appliedFilterSelections, defaultColumns);
  }

  getFeatureSelectors(setupObject, appliedFilterSelections, defaultColumns) {
    let allFeatureSelectors = [];
    // for each feature
    setupObject.children[this.IDX_OF_FEATURES_ARR].forEach((featureIndex, k) => {
      let featureColumns = [];
      // find feature's observation columns
      setupObject.features[featureIndex].children[this.IDX_OF_OBSERVATION_COL_IDXS].forEach((observationColumnIndex, i) => {
        featureColumns.push({
          column: setupObject.columns[observationColumnIndex],
          returnableID: this.getReturnableID([this.IDX_OF_FEATURES_ARR, k, this.IDX_OF_OBSERVATION_COL_IDXS, i], setupObject)
        });
      });
      // find feature's attribute columns
      setupObject.features[featureIndex].children[this.IDX_OF_ATTRIBUTE_COL_IDXS].forEach((attributeColumnIndex, i) => {
        featureColumns.push({
          column: setupObject.columns[attributeColumnIndex],
          returnableID: this.getReturnableID([this.IDX_OF_FEATURES_ARR, k, this.IDX_OF_ATTRIBUTE_COL_IDXS, i], setupObject)
        });
      });
      allFeatureSelectors[setupObject.features[featureIndex].frontendName] = this.parseColumns(featureColumns,
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
