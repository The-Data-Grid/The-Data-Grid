import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-reusable-template',
  templateUrl: './reusable-template.component.html',
  // styleUrls: ['./reusable-template.component.css']
  styleUrls: ['../audits/audits.component.css']
})
export class ReusableTemplateComponent implements OnInit {

  constructor() { }

  _selectedFeature;
  _featureSelectors = {};
  _numericChoiceTemplate;
  _numericEqualTemplate;
  _calendarRangeTemplate;
  _calendarEqualTemplate;
  _dropdownTemplate;
  _searchableDropdownTemplate;
  _checklistDropdownTemplate;
  _searchableChecklistDropdownTemplate;
  _textTemplate;
  _boolTemplate;

  globalSelectors = []
  selectorsLoaded = true;


  @Input() set selectedFeature(selectedFeature) {this._selectedFeature = selectedFeature;}
  @Input() set featureSelectors(featureSelectors) {this._featureSelectors = featureSelectors;}
  @Input() set numericChoiceTemplate(numericChoiceTemplate) {this._numericChoiceTemplate = numericChoiceTemplate}
  @Input() set numericEqualTemplate(numericEqualTemplate) {this._numericEqualTemplate = numericEqualTemplate}
  @Input() set calendarRangeTemplate(calendarRangeTemplate) {this._calendarRangeTemplate = calendarRangeTemplate};
  @Input() set calendarEqualTemplate(calendarEqualTemplate) {this._calendarEqualTemplate = calendarEqualTemplate}
  @Input() set dropdownTemplate(dropdownTemplate) {this._dropdownTemplate = dropdownTemplate}
  @Input() set searchableDropdownTemplate(searchableDropdownTemplate) {this._searchableDropdownTemplate = searchableDropdownTemplate}
  @Input() set checklistDropdownTemplate(checklistDropdownTemplate) {this._checklistDropdownTemplate = checklistDropdownTemplate}
  @Input() set searchableChecklistDropdownTemplate(searchableChecklistDropdownTemplate) {this._searchableChecklistDropdownTemplate = searchableChecklistDropdownTemplate}
  @Input() set textTemplate(textTemplate) {this._textTemplate = textTemplate};
  @Input() set boolTemplate(boolTemplate) {this._boolTemplate = boolTemplate}
  
  ngOnInit(): void {
  }
  


}
