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
  // styleUrls: ['./reusable-template.component.css']
  styleUrls: ['../audits/audits.component.css']
})
export class ReusableTemplateComponent implements OnInit {

  constructor(private apiService: ApiService, 
    private setupObjectService: SetupObjectService,
    private tableObjectService: TableObjectService) { }

  @Input() set selectedFeature(selectedFeature) {this._selectedFeature = selectedFeature;}
  @Input() set featureSelectors(featureSelectors) {this._featureSelectors = featureSelectors;}  

  setupObject;
  appliedFilterSelections = {}
  dropdownList = FakeData;
  searchableDropdownSettings: IDropdownSettings = SearchableDropdownSettings;
  checklistDropdownSettings: IDropdownSettings = ChecklistDropdownSettings;
  searchableChecklistDropdownSettings: IDropdownSettings = SearchableChecklistDropdownSettings;
  numericRelation: string[][] = [[">=","gte"],["<=","lte"],[">","gt"],["<","lt"],["=","equal"]]
  selectorsLoaded: boolean = false;

  _selectedFeature;
  _featureSelectors = {};
  globalSelectors = []

  

  ngOnInit(): void {}

  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }

  


}
