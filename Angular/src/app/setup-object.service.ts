import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SetupObjectService {

  IDX_OF_ROOT_FEATURES_ARR = 0;
  IDX_OF_GLOBAL_ITEM_IDX = 1;
  IDX_OF_ID_COLUMN_IDXS = 0
  constructor() { }

  getRootFeatures(setupObject) {
    let rootFeatures = []
    let j = 0;
    while (j < setupObject.subfeatureStartIndex) {
      rootFeatures.push(setupObject.features[setupObject.children[this.IDX_OF_ROOT_FEATURES_ARR][j]]);
      j++;
    }
    return rootFeatures;
  }

  getGlobalSelectors(setupObject, appliedFilterSelections, defaultColumns) {
    let globalItemIndex = setupObject.children[this.IDX_OF_GLOBAL_ITEM_IDX];
    let globalColumns = [];
    // look at global IDColumns 
    setupObject.items[globalItemIndex].children[this.IDX_OF_ID_COLUMN_IDXS].forEach((IDColumnIndex, i) => {
      console.log(setupObject);
      globalColumns.push({
        column: setupObject.columns[IDColumnIndex],
        returnableID: this.getReturnableID([this.IDX_OF_GLOBAL_ITEM_IDX, this.IDX_OF_ID_COLUMN_IDXS, i], setupObject)
      });
    });
    return this.parseColumns(globalColumns, appliedFilterSelections, defaultColumns);
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
