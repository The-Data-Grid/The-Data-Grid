import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';

import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import { SetupObject, TableObject } from '../responses'
// import { TableObject } from '../responses';
// import { SetupObject} from '../setupObjectTry1';
import { environment } from '../../environments/environment';
import { AppliedFilterSelections } from '../models';
const USE_FAKE_DATA = environment.useFakeData;

@Component({
  selector: 'app-reusable-template',
  templateUrl: './reusable-template.component.html',
  styleUrls: ['./reusable-template.component.css']
  // styleUrls: ['../audits/audits.component.css']
})
export class ReusableTemplateComponent implements OnInit {

  constructor(private apiService: ApiService,
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) { }

  @Input() feature: any
  @Input() page: any
  @Input() featureSelectors: any[]
  @Input() featureIndex: number
  @Input() appliedFilterSelections: AppliedFilterSelections
  @Input() returnableIDs: AppliedFilterSelections


  dropdownOptions: any = null;
  setupObject;
  dropdownList = FakeData;
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;
  numericRelation: string[][] = [[">=", "gte"], ["<=", "lte"], [">", "gt"], ["<", "lt"], ["=", "equal"]]
  selectorsLoaded: boolean = false;
  IDtoOptions;


  ngOnInit() {
    if (this.appliedFilterSelections == undefined) {
      //if we don't get appliedFilterSelections passed in, set an empty AppliedFilterSelections Object
      this.appliedFilterSelections = {
        numericChoice: {},
        numericEqual: {},
        calendarRange: {},
        calendarEqual: {},
        dropdown: {},
        searchableDropdown: [],
        checklistDropdown: [],
        searchableChecklistDropdown: [],
        text: {},
        bool: {},
        _placeholder: "placeholder"
      };
    }
    this.getDropdownOptions();

  }

  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }

  getDropdownOptions() {
    this.apiService.getDropdownOptions(this.returnableIDs).subscribe((res) => {
      this.dropdownOptions = res;
      console.log("dropdown (from resusable.ts):");
      console.log(this.dropdownOptions)
      this.IDtoOptions = this.mapIDtoOptions();
      // console.log(this.IDtoOptions)
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
        if (option===null || option[0] === null) {
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



}
