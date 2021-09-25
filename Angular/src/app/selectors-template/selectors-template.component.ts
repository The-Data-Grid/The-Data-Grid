import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { ItemCreationComponent } from '../upload-audit/item-creation/item-creation.component';
import { MatDialog } from '@angular/material/dialog';

//   selectorsLoaded: boolean = false;

@Component({
  selector: 'app-selectors-template',
  templateUrl: './selectors-template.component.html',
  styleUrls: ['./selectors-template.component.css']
})
export class SelectorsTemplateComponent implements OnInit {

  @Input() treeIDobjects: {}
  @Input() returnableIDs: []
  @Input() auditName: string
  @Input() columnsType: string //should be "IDcolumns", "nonIDcolumns", "attributeColumns"

  constructor(private apiService: ApiService, public dialog: MatDialog,) { }

  setupObject;
  dropdownOptions;
  IDtoOptions;
  columnInfos;

  // TODO: form querystrings by looking at the items and getting the user selections
  numericRelation: string[][] = [[">=", "gte"], ["<=", "lte"], [">", "gt"], ["<", "lt"], ["=", "equal"]]
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;

  ngOnInit(): void {
    if (!this.columnsType) {
      this.columnsType = 'IDColumns'
    }
    this.getDropdownOptions();
  }

  getDropdownOptions() {
    this.apiService.getDropdownOptions(this.returnableIDs, this.auditName).subscribe((res) => {
      this.dropdownOptions = res;
      // console.log("dropdown (from resusable.ts):");
      // console.log("dropdown options:", this.dropdownOptions)
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

  openItemCreation(treeIDObject): void {
    const dialogRef = this.dialog.open(ItemCreationComponent, {
      width: '801px',
      data: treeIDObject
    })
  }

  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }
}
