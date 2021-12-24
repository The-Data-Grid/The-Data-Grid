import { Component, OnInit, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { ApiService } from '../api.service';
import {FormControl} from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppliedFilterSelections } from '../models'
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
 selector: 'app-filter-new',
 templateUrl: './filter.component.html',
 styleUrls: ['./filter.component.css']
})
export class NewFilterComponent implements OnInit {

 constructor(private apiService: ApiService,
   public datepipe: DatePipe,
   private setupObjectService: SetupObjectService,
   private tableObjectService: TableObjectService) { }

ngOnInit() {
    let {
    	isXs,
    	isSm,
    	isM,
    	isL
	} = this.calcBreakpoints(window.innerWidth);

	this.isXs = isXs;
	this.isSm = isSm;
	this.isM = isM;
	this.isL = isL;
}

// Table Data

materialTableDataSource = [
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"],
	['good basin', 'bad brand', "somethingNew"]
];

dataColumnHeaders = [{
  returnableID: 10,
  frontendName: 'Basin Quality'
},
{
  returnableID: 20,
  frontendName: 'Handle Brand'
},
{
  returnableID: 40,
  frontendName: 'camelCase?'
}]

headerNames = this.dataColumnHeaders.map(header => header.returnableID)

// API Requests

setupObject;
setupFilterObject;

progressBarMode = 'determinate'
progressBarValue = 100


// Forms

fieldsOptions = [1,2,32342342342342342]
selectedFeature = 'Sink';
features = ['Sink', 'Mirror', 'Urinal']

fieldsForm = new FormControl();


// Download

runDownload() {

}

downloadType = 'csv';

// Breakpoints

isXs;
isSm;
isM;
isL

calcBreakpoints(width) {
	let isXs = false;
	let isSm = false
	let isM = false
	let isL = false
	if(width > 1100) {
		isL = true;
	}
	else if(width > 768) {
		isM = true;
	}
	else if(width > 640) {
		isSm = true;
	}
	else {
		isXs = true;
	}
	return {
		isXs,
		isSm,
		isM,
		isL
	};
}

@HostListener('window:resize')
onResize() {
	let {
		isXs,
		isSm,
		isM,
		isL
	} = this.calcBreakpoints(window.innerWidth);

	this.isXs = isXs;
	this.isSm = isSm;
	this.isM = isM;
	this.isL = isL;
}

 
}
