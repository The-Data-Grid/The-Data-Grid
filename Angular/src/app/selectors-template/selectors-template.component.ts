import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import { AppliedFilterSelections } from '../models';

//   @Input() feature: any
//   @Input() featureIndex: number

//   selectorsLoaded: boolean = false;

@Component({
  selector: 'app-selectors-template',
  templateUrl: './selectors-template.component.html',
  styleUrls: ['./selectors-template.component.css']
})
export class SelectorsTemplateComponent implements OnInit {

  @Input() treeIDobjects: {}
  @Input() returnableIDs: []

  constructor(private apiService: ApiService,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) { }

  setupObject;
  dropdownOptions;
  IDtoOptions;

  // TODO: look at the items and get returnable IDs
  // TODO: form querystrings by looking at the items and getting the user selections
  numericRelation: string[][] = [[">=", "gte"], ["<=", "lte"], [">", "gt"], ["<", "lt"], ["=", "equal"]]
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;

  ngOnInit(): void {
    this.getDropdownOptions();
  }

  getDropdownOptions() {
    this.apiService.getDropdownOptions(this.returnableIDs).subscribe((res) => {
      this.dropdownOptions = res;
      // console.log("dropdown (from resusable.ts):");
      console.log("dropdown options:", this.dropdownOptions)
      this.IDtoOptions = this.mapIDtoOptions();
      console.log("ID to options:", this.IDtoOptions)
    })
  }



  mapIDtoOptions() {
    let IDtoOptions = {}
    //for each returnable id...
    this.dropdownOptions.returnableIDs.forEach((ID, i) => {
      IDtoOptions[ID] = []
      //each returnableID is associated with an array of options. 
      //for each element (option) in this array...
      this.dropdownOptions.columnData[i].forEach((option, j) => {
        //this basically makes sure we are not setting item_text: [null]
        //bc for some reason we are getting stuff like that in the response
        if (option === null || option[0] === null) {
          IDtoOptions[ID].push({
            item_id: j,
            item_text: "None"
          })
        }
        else {
          IDtoOptions[ID].push({
            item_id: j,
            item_text: option
          })
        }
      });
    })
    return IDtoOptions;
  }

  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }
}
