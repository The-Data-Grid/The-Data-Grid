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
  @Input() appliedFilterSelections: any

  setupObject;
  dropdownList = FakeData;
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;
  numericRelation: string[][] = [[">=", "gte"], ["<=", "lte"], [">", "gt"], ["<", "lt"], ["=", "equal"]]
  selectorsLoaded: boolean = false;



  ngOnInit() {
    if (this.appliedFilterSelections == undefined) {
      this.appliedFilterSelections = {}
    }
  }

  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }




}
