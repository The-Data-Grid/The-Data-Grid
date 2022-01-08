import { Component, OnInit, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe, CommonModule, isPlatformServer } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppliedFilterSelections } from '../models'
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';

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

@ViewChild('paginator') paginator: MatPaginator;

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

	this.getSetupObjects();
}

// Table Data

tableData = [];

headerNames = [];

// API Requests

setupObject;
setupFilterObject;
allFeatures;
allItems;
filterableColumnObjects = [];
relevantColumnObjects = [];
currentReturnableIDs = [];
currentColumnObjectIndices = [];
queryType = 'Observations';
rowCount;
currentPageSize = 10;
currentPageIndex = 0;

onQueryTypeChange() {
	this.featuresOrItems = this.queryType == 'Observations' ? this.allFeatures : this.allItems;
	this.selectedFeature = this.queryType == 'Observations' ? 2 : 15;
	this.onFeatureSelectChange();
}

onFeatureSelectChange() {
	this.getFilterableColumnIDs(this.selectedFeature);
}

onFieldSelection() {

}

onSortSelection() {

}

onPageChange(event: PageEvent): PageEvent {
	// update page data
	this.currentPageSize = event.pageSize;
	this.currentPageIndex = event.pageIndex;
	// refresh API
	this.runQuery(true);
	return event;
}

getSetupObjects() {
	this.apiService.getSetupObject().subscribe((res) => {
		this.setupObject = res;
		this.parseSetupObject();
	});

	this.apiService.getSetupFilterObject().subscribe((res) => {
		this.setupFilterObject = res;
		this.getFilterableColumnIDs(2);
		this.runQuery(false);
	})
  }
  
parseSetupObject() {
	// get root features
	this.allFeatures = this.setupObject.features;
	this.allItems = this.setupObject.items;
	this.featuresOrItems = this.queryType == 'Observations' ? this.allFeatures : this.allItems;
}

getFilterableColumnIDs(featureID): any {
	if(this.queryType == 'Observations') {
		this.currentColumnObjectIndices = this.setupFilterObject.observationColumnObjectIndices[featureID];
		this.currentReturnableIDs = this.setupFilterObject.observationReturnableIDs[featureID];

	} else {
		this.currentColumnObjectIndices = this.setupFilterObject.itemColumnObjectIndices[featureID];
		this.currentReturnableIDs = this.setupFilterObject.itemReturnableIDs[featureID];
	}

	this.filterableColumnObjects = this.currentColumnObjectIndices
			.map(index => this.setupObject.columns[index])
			.filter(col => col.filterSelector !== null);

	this.relevantColumnObjects = this.currentColumnObjectIndices
		.map(index => this.setupObject.columns[index]);

	this.selectedFields = this.relevantColumnObjects.map((col, i) => i)
	this.selectedSortField = undefined;
}

getReturnablesFromColumnIDs(indices, isObservation, featureID): Array<Number> {
	if(isObservation) {
		return indices
			.map(index => this.setupFilterObject.observationReturnableIDs[featureID][index]);
	} else {
		return indices
			.map(index => this.setupFilterObject.itemReturnableIDs[featureID][index]);
	}
}

progressBarMode = 'determinate'
progressBarValue = 100

runQuery(isPaginationQuery) {
	this.progressBarMode = 'indeterminate';
	const isObservation = this.queryType === 'Observations';
	const feature = isObservation ? 
		this.allFeatures[this.selectedFeature].backendName :
		this.allItems[this.selectedFeature].backendName;
	const columnObjectIndices = this.currentColumnObjectIndices;
	const columnObjectIndicesIndices = [...new Set([...this.selectedFields, ...(this.selectedSortField ? [this.selectedSortField] : [])])]
	const returnableIDs = this.getReturnablesFromColumnIDs(columnObjectIndicesIndices, isObservation, this.selectedFeature);
	const sortObject = this.selectedSortField ? {
		isAscending: this.filterBy === 'Ascending',
		returnableID: this.getReturnablesFromColumnIDs([this.selectedSortField], isObservation, this.selectedFeature)[0]
	} : null;
	const pageObject = {
		limit: this.currentPageSize,
		offset: this.currentPageIndex * this.currentPageSize
	};
	// 
	this.apiService.newGetTableObject(isObservation, feature, returnableIDs, '', sortObject, pageObject).subscribe((res) => {
		this.headerNames = ['ID', ...res.returnableIDs.map(id => this.setupObject.columns[columnObjectIndices[returnableIDs.indexOf(id)]].frontendName)];
		this.tableData = res.rowData.map((row, i) => [res.primaryKey[i], ...row]);

		this.rowCount = res.nRows.n;
		if(!isPaginationQuery) {
			this.paginator.firstPage();
		}

		this.progressBarMode = 'determinate';
	  });
}

// Forms

fieldsOptions = [];
selectedFeature = 2; //Sink
featuresOrItems = [];
selectedFields = [];
selectedSortField;
filterBy = 'Ascending';


// Download

runDownload() {
	this.isDownloading = true;
	const isObservation = this.queryType === 'Observations';
	const feature = isObservation ? 
		this.allFeatures[this.selectedFeature].backendName :
		this.allItems[this.selectedFeature].backendName;
	const columnObjectIndices = this.currentColumnObjectIndices;
	const columnObjectIndicesIndices = [...new Set([...this.selectedFields, ...(this.selectedSortField ? [this.selectedSortField] : [])])]
	const returnableIDs = this.getReturnablesFromColumnIDs(columnObjectIndicesIndices, isObservation, this.selectedFeature);
	const sortObject = this.selectedSortField ? {
		isAscending: this.filterBy === 'Ascending',
		returnableID: this.getReturnablesFromColumnIDs([this.selectedSortField], isObservation, this.selectedFeature)[0]
	} : null;
	const isCSV = this.downloadType === 'csv';
	this.apiService.downloadTableObject(isObservation, feature, returnableIDs, '', sortObject, isCSV).subscribe((res) => {
		this.blob = new Blob([res], {type: isCSV ? 'text/csv' : 'application/json'});

		var downloadURL = window.URL.createObjectURL(res);
		var link = document.createElement('a');
		link.href = downloadURL;
		link.download = isCSV ? "The-Data-Grid-Download.csv" : "The-Data-Grid-Download.json";
		link.click();
		this.isDownloading = false;
	})
}

downloadType = 'csv';
blob;
isDownloading = false;

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
