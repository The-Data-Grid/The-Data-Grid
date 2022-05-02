import { Component, OnInit, HostListener, ViewChild, AfterViewInit, NgModule } from '@angular/core';
import { ApiService } from '../api.service';
import { DatePipe, CommonModule, isPlatformServer } from '@angular/common';
import { SearchableDropdownSettings, ChecklistDropdownSettings, SearchableChecklistDropdownSettings, FakeData } from '../dropdown-settings'
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppliedFilterSelections } from '../models'
import { SetupObjectService } from '../setup-object.service';
import { TableObjectService } from '../table-object.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import * as $ from 'jquery';
import * as L from 'leaflet';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import 'jQuery-QueryBuilder/dist/js/query-builder.js';

@Component({
 selector: 'app-filter-new',
 templateUrl: './filter.component.html',
 styleUrls: ['./filter.component.css']
})

export class NewFilterComponent implements OnInit, AfterViewInit {

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
	this.getQueryBuilder();
}

ngAfterViewInit(): void {
	this.initMap();
}

isFirstQuery = true;
filters = [{
	id: "15",
	label: "Factor",
	type: 'string',
	input: 'select',
	values: ['YRL', 'Powell', 'Math Sciences'],
	operators: ['equal']
},
{
	id: "16",
	label: "List",
	type: 'string',
	input: 'select',
	values: ['YRL', 'Powell', 'Math Sciences'],
	operators: ['contains']
},
{
	id: "17",
	label: "Numeric",
	type: 'string',
	input: 'number',
	values: ['YRL', 'Powell', 'Math Sciences'],
	operators: ['equal', 'less', 'less_or_equal', 'greater', 'greater_or_equal']
},
{
	id: "18",
	label: "Text",
	type: 'string',
	input: 'text',
	operators: ['equal']
},
{
	id: "19",
	label: "Boolean",
	type: 'string',
	input: 'radio',
	values: ['true', 'false'],
	operators: ['equal']
}];


getQueryBuilder() {
	$(document).ready(() => {
		(<any>$('#builder')).queryBuilder({
			plugins: [],
			// This is just toy data
			filters: this.filters,
			select_placeholder: '-',
			rules: [{
				/* empty rule */
				empty: true
			}],
			allow_empty: true
		})
	})

}

refreshQueryBuilder() {
	(<any>$('#builder')).queryBuilder('reset');
	(<any>$('#builder')).queryBuilder('setOptions', {
		plugins: [],
		filters: this.filters,
		select_placeholder: '-',
		rules: [{
			/* empty rule */
			empty: true
		}],
		allow_empty: true
	})
}

getRulesQueryBuilder() {
	return (<any>$('#builder')).queryBuilder('getRules', { skip_empty: true });
}


private operationMap = {
	equal: '=',
	contains: 'contains',

}
formatQueryString(rules) {
	if(rules.rules.length == 0) return '';
	let group = [];


	return encodeURIComponent(JSON.stringify(rules));

	function isGroup(obj) {
		'condition' in obj;
	}

	function traverseGroup(group) {
		let newGroup = [];
		newGroup.push(group.condition === 'AND' ? 0 : 1);
		for(let element of group.slice(1)) {
			if(isGroup) {
				newGroup.push(traverseGroup(element));
			} else {
				newGroup.push({

				})
			}
		}
	}
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
	let finishSetup;
	let hasSetupFinished = new Promise((resolve, reject) => {
		finishSetup = resolve;
	})

	this.apiService.getSetupObject().subscribe((res) => {
		this.setupObject = res;
		this.parseSetupObject();
		finishSetup();
	});

	this.apiService.getSetupFilterObject().subscribe((res) => {
		hasSetupFinished.then(() => {
			this.setupFilterObject = res;
			this.getFilterableColumnIDs(2);
			this.runQuery(false);
		});
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

queryTime = null;
queryStart = null;
isCached = null;
queryTimer(start) {
	if(start) {
		this.queryStart = Date.now();
	} else {
		this.queryTime = Date.now() - this.queryStart
	}
}

invalidQuery = false;
queryError = null;

runQuery(isPaginationQuery) {
	this.invalidQuery = false;
	this.queryError = null;
	let queryString = '';
	if(!this.isFirstQuery) {
		const rules = this.getRulesQueryBuilder();
		if(rules === null) {
			this.invalidQuery = true;
			return;
		}
		queryString = this.formatQueryString(rules)
	} 
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
	this.queryTimer(true);
	this.apiService.newGetTableObject(isObservation, feature, returnableIDs, queryString, sortObject, pageObject).subscribe((res) => {
		this.headerNames = ['ID', ...res.returnableIDs.map(id => this.setupObject.columns[columnObjectIndices[returnableIDs.indexOf(id)]].frontendName)];
		this.tableData = res.rowData.map((row, i) => [res.primaryKey[i], ...row]);

		this.rowCount = res.nRows.n;
		if(!isPaginationQuery) {
			this.paginator.firstPage();
		}

		this.isCached = res.cached === true;

		this.progressBarMode = 'determinate';
		this.isFirstQuery = false;
		this.queryTimer(false)
	  }, (err) => {
		  this.progressBarMode = 'determinate'
		  this.isFirstQuery = false;
		  this.queryTimer(false);
		  this.queryError = err.error;
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


/* Geospatial */

binData = {
	"type": "FeatureCollection",
	"name": "peer_reviewed_labels6",
	"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
	"features": [
	{ "type": "Feature", "properties": { "Name": "1001FR", "Stream": "Recycle", "Bin Number": "001", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441154597097807, 34.071020184361288, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1002FL", "Stream": "Landfill", "Bin Number": "002", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441148575217994, 34.071021012066652, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1003DR", "Stream": "Recycle", "Bin Number": "003", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442201385791805, 34.071051562028707, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1004DL", "Stream": "Landfill", "Bin Number": "004", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442194201356301, 34.071051578343528, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1005DC", "Stream": "Compost", "Bin Number": "005", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442189484638504, 34.071051639384521, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1006LL", "Stream": "Landfill", "Bin Number": "006", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442488558334105, 34.071067083265461, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1007LL", "Stream": "Landfill", "Bin Number": "007", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442292078332798, 34.071072760432251, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1008LL", "Stream": "Landfill", "Bin Number": "008", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442077748191807, 34.071072925912418, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1009LL", "Stream": "Landfill", "Bin Number": "009", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441987189593902, 34.071083038255338, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1010FR", "Stream": "Recycle", "Bin Number": "010", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439213685195398, 34.071155607047601, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1011FL", "Stream": "Landfill", "Bin Number": "011", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439224203918201, 34.071156828475033, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1012LL", "Stream": "Landfill", "Bin Number": "012", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441956675086402, 34.071185512543011, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1013LL", "Stream": "Landfill", "Bin Number": "013", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441796733800501, 34.071192165838909, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1014LL", "Stream": "Landfill", "Bin Number": "014", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441988432930103, 34.071212896291577, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1015FR", "Stream": "Recycle", "Bin Number": "015", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442628845333402, 34.071215627734603, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1016FL", "Stream": "Landfill", "Bin Number": "016", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441684716579999, 34.071217227653513, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1017FL", "Stream": "Landfill", "Bin Number": "017", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442636690873201, 34.071224229918208, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1018LL", "Stream": "Landfill", "Bin Number": "018", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442247978459207, 34.07122461735716, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1019FR", "Stream": "Recycle", "Bin Number": "019", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441685949891706, 34.071230714778167, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1020LL", "Stream": "Landfill", "Bin Number": "020", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442238151027198, 34.071335439499329, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1021DR", "Stream": "Recycle", "Bin Number": "021", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4420027580788, 34.071342430967242, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1022DC", "Stream": "Compost", "Bin Number": "022", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442003075574306, 34.071351307210442, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1023DL", "Stream": "Landfill", "Bin Number": "023", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4420039256091, 34.071355052093388, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1024DR", "Stream": "Recycle", "Bin Number": "024", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439740881888696, 34.071406023249857, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1025DL", "Stream": "Landfill", "Bin Number": "025", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4397421195318, 34.071409428046309, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1026DC", "Stream": "Compost", "Bin Number": "026", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439741446965897, 34.071409987592737, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1027FR", "Stream": "Recycle", "Bin Number": "027", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439111207324402, 34.071422935480243, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1028FL", "Stream": "Landfill", "Bin Number": "028", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439109321192504, 34.071430675930031, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1029FL", "Stream": "Landfill", "Bin Number": "029", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439458097230499, 34.071435761194031, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1030FR", "Stream": "Recycle", "Bin Number": "030", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4394539777348, 34.071435884063327, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1031FR", "Stream": "Recycle", "Bin Number": "031", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440889199939804, 34.071459781515657, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1032FL", "Stream": "Landfill", "Bin Number": "032", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440889096250302, 34.071469034244821, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1033FR", "Stream": "Recycle", "Bin Number": "033", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4415494203447, 34.071547767528592, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1034FL", "Stream": "Landfill", "Bin Number": "034", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4415547363527, 34.07154916065975, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1035FR", "Stream": "Recycle", "Bin Number": "035", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442636192558496, 34.071592049040561, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1036FL", "Stream": "Landfill", "Bin Number": "036", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442644350700107, 34.071592454395699, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1037DL", "Stream": "Landfill", "Bin Number": "037", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438539482255095, 34.071725206432852, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1038DR", "Stream": "Recycle", "Bin Number": "038", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438522136415202, 34.071728727592102, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1039DC", "Stream": "Compost", "Bin Number": "039", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438544533722094, 34.071729685361909, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1040FL", "Stream": "Landfill", "Bin Number": "040", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438776296116302, 34.071746689586533, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1041FR", "Stream": "Recycle", "Bin Number": "041", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438783074656996, 34.071747677302739, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1042FR", "Stream": "Recycle", "Bin Number": "042", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442292520158304, 34.071928242915959, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1043FL", "Stream": "Landfill", "Bin Number": "043", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442302796375003, 34.071928716414419, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1044FL", "Stream": "Landfill", "Bin Number": "044", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442066747541205, 34.071929312876051, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1045FR", "Stream": "Recycle", "Bin Number": "045", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442057003964095, 34.071929767430888, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1046DC", "Stream": "Compost", "Bin Number": "046", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440679415115298, 34.071940894151517, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1047DR", "Stream": "Recycle", "Bin Number": "047", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440697747199394, 34.071941844962502, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1048DL", "Stream": "Landfill", "Bin Number": "048", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440672779034998, 34.071943113321247, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1049FR", "Stream": "Recycle", "Bin Number": "049", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439761892710195, 34.071945566085127, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1050FL", "Stream": "Landfill", "Bin Number": "050", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439750205084493, 34.07194637615023, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1051FR", "Stream": "Recycle", "Bin Number": "051", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442079059738802, 34.071968579579718, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1052AC", "Stream": "Compost", "Bin Number": "052", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441163203788307, 34.071969753797767, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1053FR", "Stream": "Recycle", "Bin Number": "053", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442293378571506, 34.071970641254417, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1054FL", "Stream": "Landfill", "Bin Number": "054", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442287008718594, 34.07197083644494, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1055FL", "Stream": "Landfill", "Bin Number": "055", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442068386959704, 34.071971077273872, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1056AS", "Stream": "Landfill", "Bin Number": "056", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441177027756396, 34.071972130666737, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1057FL", "Stream": "Landfill", "Bin Number": "057", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442602551734097, 34.071974561640459, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1058AR", "Stream": "Recycle", "Bin Number": "058", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441170946381405, 34.071978752346432, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1059FR", "Stream": "Recycle", "Bin Number": "059", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442592715121506, 34.071979475167893, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1060FR", "Stream": "Recycle", "Bin Number": "060", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438486145087694, 34.072023314209417, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1061FL", "Stream": "Landfill", "Bin Number": "061", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438466847688005, 34.072024377755042, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1062FR", "Stream": "Recycle", "Bin Number": "062", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439237716912999, 34.072032677775439, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1063FL", "Stream": "Landfill", "Bin Number": "063", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439233070481293, 34.072032692610129, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1064DR", "Stream": "Recycle", "Bin Number": "064", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438986983044401, 34.072383571065423, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1065DC", "Stream": "Compost", "Bin Number": "065", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438992755568293, 34.072384646209933, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1066DL", "Stream": "Landfill", "Bin Number": "066", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438997614100401, 34.072385390671947, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1067FL", "Stream": "Landfill", "Bin Number": "067", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442310277341093, 34.072429207196542, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1068FR", "Stream": "Recycle", "Bin Number": "068", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442063830309607, 34.072429678500001, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1069FR", "Stream": "Recycle", "Bin Number": "069", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442319812388106, 34.072430138358477, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1070FL", "Stream": "Landfill", "Bin Number": "070", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442054373025201, 34.072431099170508, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1071AC", "Stream": "Compost", "Bin Number": "071", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441219289501802, 34.072431560344548, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1072AS", "Stream": "Landfill", "Bin Number": "072", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441219289501802, 34.072431560344548, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1073AR", "Stream": "Recycle", "Bin Number": "073", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441227889109001, 34.072432077548108, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1074DR", "Stream": "Recycle", "Bin Number": "074", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440683091958604, 34.072450240931509, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1075DL", "Stream": "Landfill", "Bin Number": "075", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440666622017801, 34.072450248000138, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1076FL", "Stream": "Landfill", "Bin Number": "076", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438646656300406, 34.072450545676098, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1077FL", "Stream": "Landfill", "Bin Number": "077", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439837704997004, 34.072451847702467, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1078DC", "Stream": "Compost", "Bin Number": "078", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440673453181603, 34.072452118099079, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1079FR", "Stream": "Recycle", "Bin Number": "079", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439824055843701, 34.072454954686243, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1080FR", "Stream": "Recycle", "Bin Number": "080", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438648645238203, 34.07245814233174, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1081FL", "Stream": "Landfill", "Bin Number": "081", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442658750905593, 34.072540442822472, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1082FR", "Stream": "Recycle", "Bin Number": "082", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442652016884395, 34.072541971830603, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1083FL", "Stream": "Landfill", "Bin Number": "083", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439527349591302, 34.072550894517818, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1084FR", "Stream": "Recycle", "Bin Number": "084", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439523899131899, 34.072565154230219, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1085DR", "Stream": "Recycle", "Bin Number": "085", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438527420735497, 34.07260279817433, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1086DL", "Stream": "Landfill", "Bin Number": "086", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438540614964793, 34.072603090858607, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1087DC", "Stream": "Compost", "Bin Number": "087", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438533995375806, 34.072603379373611, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1088FR", "Stream": "Recycle", "Bin Number": "088", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438745161392603, 34.072609624553962, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1089FL", "Stream": "Landfill", "Bin Number": "089", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438740305123005, 34.072610873070133, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1090NL", "Stream": "Landfill", "Bin Number": "090", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.437618959435497, 34.072644292571319, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1091NR", "Stream": "Recycle", "Bin Number": "091", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.437606884419196, 34.072647276021058, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1092DL", "Stream": "Landfill", "Bin Number": "092", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4415685555919, 34.072735857879003, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1093DC", "Stream": "Compost", "Bin Number": "093", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441574730737202, 34.07273607098896, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1094DR", "Stream": "Recycle", "Bin Number": "094", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441580949052295, 34.072736273119062, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1095FR", "Stream": "Recycle", "Bin Number": "095", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4410071591643, 34.072853484142527, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1096FL", "Stream": "Landfill", "Bin Number": "096", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441000463501396, 34.072854957728183, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1097AS", "Stream": "Landfill", "Bin Number": "097", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439743326866093, 34.073055814752337, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1098AR", "Stream": "Recycle", "Bin Number": "098", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439736973787305, 34.073057115597422, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1099AC", "Stream": "Compost", "Bin Number": "099", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439739839719806, 34.073058174350187, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1100FR", "Stream": "Recycle", "Bin Number": "100", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439305822664494, 34.073147434009059, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1101FL", "Stream": "Landfill", "Bin Number": "101", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441998710484796, 34.073157228665522, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1102FL", "Stream": "Landfill", "Bin Number": "102", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439301800325495, 34.073158297055549, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1103FR", "Stream": "Recycle", "Bin Number": "103", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442006277485703, 34.073161652540087, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1104NL", "Stream": "Landfill", "Bin Number": "104", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.437740933769106, 34.073190778723053, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1105FL", "Stream": "Landfill", "Bin Number": "105", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438014067724694, 34.073190926766841, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1106AC", "Stream": "Compost", "Bin Number": "106", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439002968869303, 34.07319632579366, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1107FR", "Stream": "Recycle", "Bin Number": "107", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438019796587795, 34.073199397965453, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1108AS", "Stream": "Landfill", "Bin Number": "108", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439011370756702, 34.073200523626078, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1109NR", "Stream": "Recycle", "Bin Number": "109", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.437740362960099, 34.073203833786913, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1110AR", "Stream": "Recycle", "Bin Number": "110", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438998424688194, 34.07320725870477, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1111FL", "Stream": "Landfill", "Bin Number": "111", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438811823835906, 34.073246828956059, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1112FR", "Stream": "Recycle", "Bin Number": "112", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438810250735401, 34.073261075746522, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1113DC", "Stream": "Compost", "Bin Number": "113", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440296988537199, 34.073270693090578, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1114DR", "Stream": "Recycle", "Bin Number": "114", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440303221667506, 34.073271040341659, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1115DL", "Stream": "Landfill", "Bin Number": "115", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440294425664206, 34.073271431716257, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1116FL", "Stream": "Landfill", "Bin Number": "116", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439101011552097, 34.073316909124067, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1117FR", "Stream": "Recycle", "Bin Number": "117", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439110461565306, 34.073317162817013, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1118AR", "Stream": "Recycle", "Bin Number": "118", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4416785559998, 34.073325244763787, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1119AS", "Stream": "Landfill", "Bin Number": "119", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441668991817295, 34.073328655957688, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1120AC", "Stream": "Compost", "Bin Number": "120", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441679570168702, 34.073335427254342, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1121FR", "Stream": "Recycle", "Bin Number": "121", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439290448299204, 34.073372706307737, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1122FL", "Stream": "Landfill", "Bin Number": "122", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439290069213598, 34.073378847638637, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1123FL", "Stream": "Landfill", "Bin Number": "123", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440899139821397, 34.07340068002258, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1124FR", "Stream": "Recycle", "Bin Number": "124", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440900856887694, 34.073409246310668, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1125DR", "Stream": "Recycle", "Bin Number": "125", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439510565804895, 34.073444183246011, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1126DC", "Stream": "Compost", "Bin Number": "126", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439511428325901, 34.073448884483348, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1127DL", "Stream": "Landfill", "Bin Number": "127", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439511422473203, 34.073453233107386, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1128FL", "Stream": "Landfill", "Bin Number": "128", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438733395939394, 34.073522977693237, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1129FR", "Stream": "Recycle", "Bin Number": "129", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438723224154302, 34.073523130059641, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1130FL", "Stream": "Landfill", "Bin Number": "130", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440664793401695, 34.073534733038016, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1131FR", "Stream": "Recycle", "Bin Number": "131", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440672864370597, 34.073536545453422, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1132FR", "Stream": "Recycle", "Bin Number": "132", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442301918721796, 34.073568647195131, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1133FR", "Stream": "Recycle", "Bin Number": "133", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441830150059602, 34.073569183878419, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1134FL", "Stream": "Landfill", "Bin Number": "134", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442292504072498, 34.073569200495207, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1135FL", "Stream": "Landfill", "Bin Number": "135", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.44184248226, 34.073576858705103, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1136AR", "Stream": "Recycle", "Bin Number": "136", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439682758750294, 34.073918137217213, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1137AS", "Stream": "Landfill", "Bin Number": "137", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439675670431896, 34.073923763497483, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1138AC", "Stream": "Compost", "Bin Number": "138", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439683359144198, 34.073928668709499, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1139FL", "Stream": "Landfill", "Bin Number": "139", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4401362521793, 34.073943968437952, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1140FR", "Stream": "Recycle", "Bin Number": "140", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440143346674205, 34.073945063781437, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1141DL", "Stream": "Landfill", "Bin Number": "141", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442023314088402, 34.07403785322068, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1142DC", "Stream": "Compost", "Bin Number": "142", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.442024282726507, 34.074041602906739, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1143DR", "Stream": "Recycle", "Bin Number": "143", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.44202409431, 34.074047943499018, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1144DR", "Stream": "Recycle", "Bin Number": "144", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438848481338297, 34.074067489928318, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1145DC", "Stream": "Compost", "Bin Number": "145", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438848593268602, 34.074072452935887, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1146DL", "Stream": "Landfill", "Bin Number": "146", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.438849095439593, 34.074073763808762, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1147AS", "Stream": "Landfill", "Bin Number": "147", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441437422365297, 34.074160862933383, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1148AC", "Stream": "Compost", "Bin Number": "148", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441421029987495, 34.074161644013053, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1149AR", "Stream": "Recycle", "Bin Number": "149", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441411256363907, 34.074162933183352, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1150AR", "Stream": "Recycle", "Bin Number": "150", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440733962750599, 34.074185629733158, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1151AS", "Stream": "Landfill", "Bin Number": "151", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440736523470207, 34.074186545651983, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1152AC", "Stream": "Compost", "Bin Number": "152", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440733405023394, 34.07419390769951, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1153FR", "Stream": "Recycle", "Bin Number": "153", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439401341002593, 34.07423013411556, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1154FL", "Stream": "Landfill", "Bin Number": "154", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439401216472604, 34.074236117059051, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1155FL", "Stream": "Landfill", "Bin Number": "155", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441370907407602, 34.07446691000704, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1156FR", "Stream": "Recycle", "Bin Number": "156", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441361662407303, 34.074468748768233, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1157AS", "Stream": "Landfill", "Bin Number": "157", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439569692666197, 34.074517899148667, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1158AR", "Stream": "Recycle", "Bin Number": "158", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439563398442502, 34.074522676434071, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1159AC", "Stream": "Compost", "Bin Number": "159", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439570214752905, 34.074522893593013, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1160LL", "Stream": "Landfill", "Bin Number": "160", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441448895541498, 34.074586961219588, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1161LL", "Stream": "Landfill", "Bin Number": "161", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441159764338195, 34.074588965098869, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1162LL", "Stream": "Landfill", "Bin Number": "162", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441191521025502, 34.074613838839561, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1163LL", "Stream": "Landfill", "Bin Number": "163", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441350675834997, 34.074616722027379, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1164FR", "Stream": "Recycle", "Bin Number": "164", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439820298148504, 34.075133543157158, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1165FL", "Stream": "Landfill", "Bin Number": "165", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439808782956206, 34.075138671061737, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1166DR", "Stream": "Recycle", "Bin Number": "166", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439655935710803, 34.0752295916135, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1167DC", "Stream": "Compost", "Bin Number": "167", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439660703495306, 34.07523594474528, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1168DL", "Stream": "Landfill", "Bin Number": "168", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439665932922296, 34.075236632103987, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1169DC", "Stream": "Compost", "Bin Number": "169", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440213804345007, 34.075249383944239, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1170DL", "Stream": "Landfill", "Bin Number": "170", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440216550786602, 34.075252081118023, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1171DR", "Stream": "Recycle", "Bin Number": "171", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440216950222094, 34.075253331164667, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1172FR", "Stream": "Recycle", "Bin Number": "172", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439219469237202, 34.075292645542838, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1173FL", "Stream": "Landfill", "Bin Number": "173", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4392260492817, 34.07529589328265, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1174FR", "Stream": "Recycle", "Bin Number": "174", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441542255789003, 34.075418525794653, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1175FR", "Stream": "Recycle", "Bin Number": "175", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440885789031697, 34.075421053383209, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1176FL", "Stream": "Landfill", "Bin Number": "176", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.441544884515395, 34.075423963067877, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1177FL", "Stream": "Landfill", "Bin Number": "177", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440886394406306, 34.075426082469242, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1178FR", "Stream": "Recycle", "Bin Number": "178", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439819011980006, 34.075430386013537, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1179FL", "Stream": "Landfill", "Bin Number": "179", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439809877802901, 34.075431256285881, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1180FR", "Stream": "Recycle", "Bin Number": "180", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440140599066794, 34.075478746733523, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1181FL", "Stream": "Landfill", "Bin Number": "181", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440157813566898, 34.075479321343629, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1182AS", "Stream": "Landfill", "Bin Number": "182", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440456738313699, 34.075526551202067, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1183AR", "Stream": "Recycle", "Bin Number": "183", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440465972434794, 34.075532350304663, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1184AC", "Stream": "Compost", "Bin Number": "184", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.4404565996185, 34.075533364847779, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1185NR", "Stream": "Recycle", "Bin Number": "185", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440125604938004, 34.075816945452353, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1186NL", "Stream": "Landfill", "Bin Number": "186", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440110709017404, 34.075817456623668, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1187FR", "Stream": "Recycle", "Bin Number": "187", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440832630327805, 34.075930539263197, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1188FL", "Stream": "Landfill", "Bin Number": "188", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440841911473001, 34.07593222306145, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1189NR", "Stream": "Recycle", "Bin Number": "189", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440193969426502, 34.075987545860301, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1190NL", "Stream": "Landfill", "Bin Number": "190", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440194682582998, 34.075995675072001, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1191DR", "Stream": "Recycle", "Bin Number": "191", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439201976601893, 34.076095390260583, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1192DL", "Stream": "Landfill", "Bin Number": "192", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439195939705598, 34.07609911762291, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1193DC", "Stream": "Compost", "Bin Number": "193", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439190143374901, 34.07610190925498, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1194NR", "Stream": "Recycle", "Bin Number": "194", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440201189540403, 34.07617406448211, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1195NL", "Stream": "Landfill", "Bin Number": "195", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440200989723195, 34.076183149773861, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1196MR", "Stream": "Landfill", "Bin Number": "196", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440006069754602, 34.076187531455133, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1197FR", "Stream": "Recycle", "Bin Number": "197", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439158538239298, 34.076301840678262, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1198FL", "Stream": "Landfill", "Bin Number": "198", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439164823979098, 34.076308652503357, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1199ML", "Stream": "Landfill", "Bin Number": "199", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.439549725925403, 34.07643245851466, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1200FR", "Stream": "Recycle", "Bin Number": "200", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.44047484299, 34.076463518973078, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1201FL", "Stream": "Landfill", "Bin Number": "201", "Stream Character": "L", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440500844609204, 34.076472029506768, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1202AC", "Stream": "Compost", "Bin Number": "202", "Stream Character": "C", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440759904288598, 34.07659247169709, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1203AR", "Stream": "Recycle", "Bin Number": "203", "Stream Character": "R", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440768213012404, 34.076593147324971, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "1204AS", "Stream": "Landfill", "Bin Number": "204", "Stream Character": "S", "Zone": "1" }, "geometry": { "type": "Point", "coordinates": [ -118.440764421235002, 34.076595803694403, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2001FR", "Stream": "Recycle", "Bin Number": "001", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445144996902201, 34.068609644927157, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2002FL", "Stream": "Landfill", "Bin Number": "002", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445137754803, 34.0686158372555, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2003IL", "Stream": "Landfill", "Bin Number": "003", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446168536829305, 34.068886656756483, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2004IR", "Stream": "Recycle", "Bin Number": "004", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446165822780699, 34.068887458371243, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2005DR", "Stream": "Recycle", "Bin Number": "005", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.448233263387806, 34.06890278661772, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2006DL", "Stream": "Landfill", "Bin Number": "006", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.448208829943994, 34.068910369132333, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2008IR", "Stream": "Recycle", "Bin Number": "008", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445438148812002, 34.069091435865047, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2012IR", "Stream": "Recycle", "Bin Number": "012", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446167033215602, 34.069481308982454, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2013IL", "Stream": "Landfill", "Bin Number": "013", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446167033215602, 34.069481308982454, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2014IL", "Stream": "Landfill", "Bin Number": "014", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445371265573996, 34.069503285308393, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2015IR", "Stream": "Recycle", "Bin Number": "015", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445370778916498, 34.06950492469575, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2016FL", "Stream": "Landfill", "Bin Number": "016", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443748646345398, 34.069809891633298, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2017FR", "Stream": "Recycle", "Bin Number": "017", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443748077623297, 34.069812445341093, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2018FL", "Stream": "Landfill", "Bin Number": "018", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447458080820297, 34.069818714362818, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2019FR", "Stream": "Recycle", "Bin Number": "019", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4474511461719, 34.069821315365672, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2020FR", "Stream": "Recycle", "Bin Number": "020", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4478828923463, 34.069832018563567, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2021FL", "Stream": "Landfill", "Bin Number": "021", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445437341194506, 34.069837724889467, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2022FL", "Stream": "Landfill", "Bin Number": "022", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447873962916105, 34.069838083891391, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2023FR", "Stream": "Recycle", "Bin Number": "023", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445429067154194, 34.069838998893388, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2024FR", "Stream": "Recycle", "Bin Number": "024", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444847643426698, 34.069841292348222, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2025LR", "Stream": "Recycle", "Bin Number": "025", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446683436632199, 34.069841812359257, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2026FL", "Stream": "Landfill", "Bin Number": "026", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444855161549796, 34.069841875533108, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2027FL", "Stream": "Landfill", "Bin Number": "027", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447077524139999, 34.069845123486488, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2028FR", "Stream": "Recycle", "Bin Number": "028", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447072875760895, 34.069845295950657, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2029FR", "Stream": "Recycle", "Bin Number": "029", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444724896550994, 34.069847111862103, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2030FL", "Stream": "Landfill", "Bin Number": "030", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444721341559898, 34.069848641637861, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2031LL", "Stream": "Landfill", "Bin Number": "031", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446562167987594, 34.069849894138507, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2032FR", "Stream": "Recycle", "Bin Number": "032", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446470411297, 34.069850852247818, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2033FL", "Stream": "Landfill", "Bin Number": "033", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4464374304263, 34.069859085758551, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2034FR", "Stream": "Recycle", "Bin Number": "034", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445695454642504, 34.069972638060968, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2035FL", "Stream": "Landfill", "Bin Number": "035", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445694577005398, 34.069980489267373, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2036AC", "Stream": "Compost", "Bin Number": "036", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447541059539603, 34.070030959322352, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2037AS", "Stream": "Landfill", "Bin Number": "037", "Stream Character": "S", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447533359730301, 34.070034612599422, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2038AR", "Stream": "Recycle", "Bin Number": "038", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447537980198405, 34.070037410279632, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2039AR", "Stream": "Recycle", "Bin Number": "039", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445894441392895, 34.070041498148349, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2040AS", "Stream": "Landfill", "Bin Number": "040", "Stream Character": "S", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445894441392895, 34.070041498148349, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2041AC", "Stream": "Compost", "Bin Number": "041", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445893822691005, 34.070046595884172, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2042FL", "Stream": "Landfill", "Bin Number": "042", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445835859861504, 34.070223036139467, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2043FR", "Stream": "Recycle", "Bin Number": "043", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445835859861504, 34.070223036139467, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2044FR", "Stream": "Recycle", "Bin Number": "044", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445647016883001, 34.070513542510831, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2045FL", "Stream": "Landfill", "Bin Number": "045", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445647016883001, 34.070513542510831, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2046FR", "Stream": "Recycle", "Bin Number": "046", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445226156009298, 34.070520013303629, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2047FL", "Stream": "Landfill", "Bin Number": "047", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445223729305496, 34.070530494605521, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2048FL", "Stream": "Landfill", "Bin Number": "048", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445848924325503, 34.07053503784006, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2049FR", "Stream": "Recycle", "Bin Number": "049", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445839860671597, 34.070535848384999, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2050FL", "Stream": "Landfill", "Bin Number": "050", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445995701570496, 34.070637103926693, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2051FR", "Stream": "Recycle", "Bin Number": "051", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445998695073797, 34.070649246677547, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2052FR", "Stream": "Recycle", "Bin Number": "052", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.448721912709004, 34.070710859077337, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2053FL", "Stream": "Landfill", "Bin Number": "053", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.448717629618898, 34.070718544610173, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2054PC", "Stream": "Compost", "Bin Number": "054", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444828999612596, 34.070790031667272, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2055PR", "Stream": "Recycle", "Bin Number": "055", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444828999612596, 34.070790031667272, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2056PL", "Stream": "Landfill", "Bin Number": "056", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444829257799498, 34.070790311437648, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2057FR", "Stream": "Recycle", "Bin Number": "057", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447545461975807, 34.070817062146759, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2058FL", "Stream": "Landfill", "Bin Number": "058", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447543885289306, 34.070824441073391, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2059FR", "Stream": "Recycle", "Bin Number": "059", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446150119283999, 34.070875445276229, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2060FL", "Stream": "Landfill", "Bin Number": "060", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446152032660194, 34.070880224063913, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2061FL", "Stream": "Landfill", "Bin Number": "061", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447400965042306, 34.070888330929499, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2062FR", "Stream": "Recycle", "Bin Number": "062", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447370794057207, 34.070895714682941, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2063FL", "Stream": "Landfill", "Bin Number": "063", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443657920345302, 34.070911553277817, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2064FR", "Stream": "Recycle", "Bin Number": "064", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443657920345302, 34.070911553277817, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2065FR", "Stream": "Recycle", "Bin Number": "065", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444556670407806, 34.070920813389122, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2066FL", "Stream": "Landfill", "Bin Number": "066", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4445572873732, 34.070943063416181, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2067FR", "Stream": "Recycle", "Bin Number": "067", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445392906757903, 34.070973379840247, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2068FL", "Stream": "Landfill", "Bin Number": "068", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445396754026802, 34.070975232971684, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2069FR", "Stream": "Recycle", "Bin Number": "069", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447031803274299, 34.070978625212923, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2070DR", "Stream": "Recycle", "Bin Number": "070", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445182357038405, 34.070978691378443, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2071DL", "Stream": "Landfill", "Bin Number": "071", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445182357038405, 34.070978691378443, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2073FL", "Stream": "Landfill", "Bin Number": "073", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447043440053207, 34.070979703435768, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2074FR", "Stream": "Recycle", "Bin Number": "074", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4442551805124, 34.070987529923158, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2075FL", "Stream": "Landfill", "Bin Number": "075", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4442551805124, 34.070987529923158, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2076FR", "Stream": "Recycle", "Bin Number": "076", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443926825959494, 34.070998426303497, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2078FL", "Stream": "Landfill", "Bin Number": "078", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443912843011404, 34.071001398145448, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2080FR", "Stream": "Recycle", "Bin Number": "080", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446495752150497, 34.071008487255831, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2082FL", "Stream": "Landfill", "Bin Number": "082", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446501541072394, 34.071010666357488, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2083FL", "Stream": "Landfill", "Bin Number": "083", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447464798635494, 34.07101124431135, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2084FR", "Stream": "Recycle", "Bin Number": "084", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447469636776603, 34.07101390427863, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2085DR", "Stream": "Recycle", "Bin Number": "085", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446190966292804, 34.071014552423698, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2086FR", "Stream": "Recycle", "Bin Number": "086", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449394595739804, 34.071015205821602, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2087DL", "Stream": "Landfill", "Bin Number": "087", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446179950749595, 34.071017786345912, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2088FL", "Stream": "Landfill", "Bin Number": "088", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449398249400701, 34.071018247933758, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2089DC", "Stream": "Compost", "Bin Number": "089", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446176034188994, 34.071018672304618, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2090AS", "Stream": "Landfill", "Bin Number": "090", "Stream Character": "S", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444548894757702, 34.071048527750477, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2091AC", "Stream": "Compost", "Bin Number": "091", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4445450541334, 34.071049207113482, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2092AR", "Stream": "Recycle", "Bin Number": "092", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444550795293594, 34.071051972904222, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2093FR", "Stream": "Recycle", "Bin Number": "093", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445047547741794, 34.071081583332997, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2094FL", "Stream": "Landfill", "Bin Number": "094", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445042717834198, 34.071086017884276, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2095DL", "Stream": "Landfill", "Bin Number": "095", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443610067470999, 34.071118785413738, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2096DC", "Stream": "Compost", "Bin Number": "096", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443610067470999, 34.071118785413738, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2097DR", "Stream": "Recycle", "Bin Number": "097", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443608614896206, 34.071124800563773, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2098FR", "Stream": "Recycle", "Bin Number": "098", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443211222122599, 34.071136460843498, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2099FL", "Stream": "Landfill", "Bin Number": "099", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443211222122599, 34.071136460843498, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2100FL", "Stream": "Landfill", "Bin Number": "100", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444912190209394, 34.071178339660783, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2101FR", "Stream": "Recycle", "Bin Number": "101", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444912762144298, 34.071185084508357, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2102FR", "Stream": "Recycle", "Bin Number": "102", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444645825121995, 34.071202455019552, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2103FL", "Stream": "Landfill", "Bin Number": "103", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444645825121995, 34.071202455019552, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2104FL", "Stream": "Landfill", "Bin Number": "104", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443674393069699, 34.071249849976468, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2107FR", "Stream": "Recycle", "Bin Number": "107", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443675572596703, 34.071275894675622, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2108FR", "Stream": "Recycle", "Bin Number": "108", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444502453255197, 34.071531668207797, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2109FL", "Stream": "Landfill", "Bin Number": "109", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444503158375298, 34.071543207234782, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2110FL", "Stream": "Landfill", "Bin Number": "110", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443670426141594, 34.071551803217602, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2111FR", "Stream": "Recycle", "Bin Number": "111", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443674170031699, 34.071553477221883, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2115FR", "Stream": "Recycle", "Bin Number": "115", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4446637454936, 34.071767241997428, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2116FL", "Stream": "Landfill", "Bin Number": "116", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444672514395606, 34.071767508247987, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2117AC", "Stream": "Compost", "Bin Number": "117", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443686838874598, 34.071863638946631, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2118AS", "Stream": "Landfill", "Bin Number": "118", "Stream Character": "S", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443686838874598, 34.071863638946631, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2119DR", "Stream": "Recycle", "Bin Number": "119", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444506085739704, 34.071863914415033, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2120AR", "Stream": "Recycle", "Bin Number": "120", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443677414586602, 34.071866520073151, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2121DL", "Stream": "Landfill", "Bin Number": "121", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444501918937505, 34.071872462726169, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2122DC", "Stream": "Compost", "Bin Number": "122", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444501309559698, 34.071875030040253, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2123FR", "Stream": "Recycle", "Bin Number": "123", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444247703852895, 34.071882353872503, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2124FL", "Stream": "Landfill", "Bin Number": "124", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444254075414193, 34.071882583081553, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2125FR", "Stream": "Recycle", "Bin Number": "125", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443003490414696, 34.072175053227213, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2126FL", "Stream": "Landfill", "Bin Number": "126", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4430045123611, 34.072219718288942, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2127FR", "Stream": "Recycle", "Bin Number": "127", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444024646433306, 34.072488889261933, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2128FL", "Stream": "Landfill", "Bin Number": "128", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444017053009503, 34.072490431171673, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2129FR", "Stream": "Recycle", "Bin Number": "129", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444929736575602, 34.072608320296972, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2130FL", "Stream": "Landfill", "Bin Number": "130", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444935167588596, 34.072611801762477, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2131FR", "Stream": "Recycle", "Bin Number": "131", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443544754098198, 34.072739294043302, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2132FL", "Stream": "Landfill", "Bin Number": "132", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443545008522605, 34.07275215101847, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2133AC", "Stream": "Compost", "Bin Number": "133", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443666275771207, 34.072881767521103, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2134AR", "Stream": "Recycle", "Bin Number": "134", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443666275771207, 34.072881767521103, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2135AS", "Stream": "Landfill", "Bin Number": "135", "Stream Character": "S", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443661181394802, 34.072885684837622, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2144AR", "Stream": "Recycle", "Bin Number": "144", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443757250308593, 34.073328512594969, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2146AS", "Stream": "Landfill", "Bin Number": "146", "Stream Character": "S", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443754682129097, 34.073333195722107, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2147AC", "Stream": "Compost", "Bin Number": "147", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443754682129097, 34.073333195722107, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2149FL", "Stream": "Landfill", "Bin Number": "149", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443532076871705, 34.073743732837663, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2150FR", "Stream": "Recycle", "Bin Number": "150", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443532076871705, 34.073743732837663, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2151DR", "Stream": "Recycle", "Bin Number": "151", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443799605214494, 34.073795116147451, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2152FL", "Stream": "Landfill", "Bin Number": "152", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4440981596548, 34.073799431324431, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2153FR", "Stream": "Recycle", "Bin Number": "153", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444087425659603, 34.073803647431362, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2154DL", "Stream": "Landfill", "Bin Number": "154", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443801816510302, 34.073803960429579, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2155DC", "Stream": "Compost", "Bin Number": "155", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443801816510302, 34.073803960429579, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2158FL", "Stream": "Landfill", "Bin Number": "158", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.450626826178905, 34.07521975695866, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2159FR", "Stream": "Recycle", "Bin Number": "159", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.450621084572006, 34.075227366466009, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2079DC", "Stream": "Compost", "Bin Number": "079", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449188784828493, 34.071005909804327, 136.119694444732801 ] } },
	{ "type": "Feature", "properties": { "Name": "2114DC", "Stream": "Compost", "Bin Number": "114", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449370748559602, 34.071668858100402, 128.172846709798989 ] } },
	{ "type": "Feature", "properties": { "Name": "2081DL", "Stream": "Landfill", "Bin Number": "081", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449175358060003, 34.071010485079853, 129.964203000451988 ] } },
	{ "type": "Feature", "properties": { "Name": "2113DL", "Stream": "Landfill", "Bin Number": "113", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449335928808907, 34.07166772315265, 137.215012473974696 ] } },
	{ "type": "Feature", "properties": { "Name": "2077DR", "Stream": "Recycle", "Bin Number": "077", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449166829020299, 34.071000714644157, 130.005354114691187 ] } },
	{ "type": "Feature", "properties": { "Name": "2112DR", "Stream": "Recycle", "Bin Number": "112", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.449369096301695, 34.071663582235452, 128.195762487237403 ] } },
	{ "type": "Feature", "properties": { "Name": "2139FL", "Stream": "Landfill", "Bin Number": "139", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445079360649203, 34.073210289585191, 122.449001969701897 ] } },
	{ "type": "Feature", "properties": { "Name": "2010FL", "Stream": "Landfill", "Bin Number": "010", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447737590994805, 34.069157068865309, 111.592612355848601 ] } },
	{ "type": "Feature", "properties": { "Name": "2157FL", "Stream": "Landfill", "Bin Number": "157", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443529861023904, 34.073910727188661, 128.299867977211107 ] } },
	{ "type": "Feature", "properties": { "Name": "2106FL", "Stream": "Landfill", "Bin Number": "106", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444750789979494, 34.071261230124122, 119.199542372332999 ] } },
	{ "type": "Feature", "properties": { "Name": "2136FL", "Stream": "Landfill", "Bin Number": "136", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447935521944899, 34.073115902353962, 142.978965244504707 ] } },
	{ "type": "Feature", "properties": { "Name": "2011FR", "Stream": "Recycle", "Bin Number": "011", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447737590994805, 34.069157068865309, 116.821668531130896 ] } },
	{ "type": "Feature", "properties": { "Name": "2137FR", "Stream": "Recycle", "Bin Number": "137", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.447911297221793, 34.073119665603919, 125.990677189851795 ] } },
	{ "type": "Feature", "properties": { "Name": "2138FR", "Stream": "Recycle", "Bin Number": "138", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445065608408797, 34.073207038124927, 122.347322292086304 ] } },
	{ "type": "Feature", "properties": { "Name": "2156FR", "Stream": "Recycle", "Bin Number": "156", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.443518501296396, 34.073906963331602, 128.299866699770803 ] } },
	{ "type": "Feature", "properties": { "Name": "2105FR", "Stream": "Recycle", "Bin Number": "105", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444794269703095, 34.071260270694573, 119.142492593245393 ] } },
	{ "type": "Feature", "properties": { "Name": "2145NL", "Stream": "Landfill", "Bin Number": "145", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.4460344969159, 34.073332041209163, 123.737534594755701 ] } },
	{ "type": "Feature", "properties": { "Name": "2142NL", "Stream": "Landfill", "Bin Number": "142", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445830625346005, 34.073324012277759, 122.738261138229802 ] } },
	{ "type": "Feature", "properties": { "Name": "2141NL", "Stream": "Landfill", "Bin Number": "141", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445616112836802, 34.073310489886239, 136.169537687513895 ] } },
	{ "type": "Feature", "properties": { "Name": "2160ML", "Stream": "Landfill", "Bin Number": "160", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444365919181706, 34.075303344138177, 127.608142467487497 ] } },
	{ "type": "Feature", "properties": { "Name": "2161ML", "Stream": "Landfill", "Bin Number": "161", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.444167089742294, 34.076198418020617, 135.821500104027706 ] } },
	{ "type": "Feature", "properties": { "Name": "2148NR", "Stream": "Recycle", "Bin Number": "148", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.446037428653099, 34.073342394295523, 123.452619598414202 ] } },
	{ "type": "Feature", "properties": { "Name": "2143NR", "Stream": "Recycle", "Bin Number": "143", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445816022013403, 34.073326597589762, 121.441920591408206 ] } },
	{ "type": "Feature", "properties": { "Name": "2140NR", "Stream": "Recycle", "Bin Number": "140", "Stream Character": "R", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445595370196202, 34.073305599391247, 134.974136578486906 ] } },
	{ "type": "Feature", "properties": { "Name": "2009IL", "Stream": "Landfill", "Bin Number": "009", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445438148812002, 34.069091435865047, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2007DC", "Stream": "Compost", "Bin Number": "007", "Stream Character": "C", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.448208829943994, 34.068910369132333, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "2072DL", "Stream": "Landfill", "Bin Number": "072", "Stream Character": "L", "Zone": "2" }, "geometry": { "type": "Point", "coordinates": [ -118.445182357038405, 34.070978691378443, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3001FR", "Stream": "Recycle", "Bin Number": "001", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4479818190283, 34.063762802222108, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3002FL", "Stream": "Landfill", "Bin Number": "002", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4479818190283, 34.063762802222108, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3003FL", "Stream": "Landfill", "Bin Number": "003", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.446409391817099, 34.063881530561417, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3004FR", "Stream": "Recycle", "Bin Number": "004", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.446396858222101, 34.063881588792761, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3005HR", "Stream": "Recycle", "Bin Number": "005", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445205519939293, 34.063886477871449, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3006HC", "Stream": "Compost", "Bin Number": "006", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445214357756498, 34.063886668453279, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3007FL", "Stream": "Landfill", "Bin Number": "007", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444243097685899, 34.06388814457538, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3008FR", "Stream": "Recycle", "Bin Number": "008", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444236244636599, 34.063889302663668, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3009FR", "Stream": "Recycle", "Bin Number": "009", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445616081370403, 34.064147234404203, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3010FL", "Stream": "Landfill", "Bin Number": "010", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445616081370403, 34.064147234404203, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3011AR", "Stream": "Recycle", "Bin Number": "011", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.446971794776204, 34.064152287712837, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3012AC", "Stream": "Compost", "Bin Number": "012", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.446979782174907, 34.064157547927479, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3013AS", "Stream": "Landfill", "Bin Number": "013", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.446974640351002, 34.064158782096968, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3014FL", "Stream": "Landfill", "Bin Number": "014", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442394001122096, 34.06419861652806, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3015FR", "Stream": "Recycle", "Bin Number": "015", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442395933369198, 34.064204332325978, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3016FR", "Stream": "Recycle", "Bin Number": "016", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444150088369796, 34.064731303015478, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3017FL", "Stream": "Landfill", "Bin Number": "017", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444159501196594, 34.064732047374889, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3018FL", "Stream": "Landfill", "Bin Number": "018", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445191994164702, 34.064808241680893, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3019FR", "Stream": "Recycle", "Bin Number": "019", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445184196715203, 34.064808639553497, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3020DL", "Stream": "Landfill", "Bin Number": "020", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442536081742901, 34.064821794081631, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3021DC", "Stream": "Compost", "Bin Number": "021", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442540263055093, 34.064822741006147, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3022DR", "Stream": "Recycle", "Bin Number": "022", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442538623737903, 34.064829423831227, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3023FL", "Stream": "Landfill", "Bin Number": "023", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442844783785503, 34.064883843160757, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3024FR", "Stream": "Recycle", "Bin Number": "024", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442835602046401, 34.064884212153707, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3025DR", "Stream": "Recycle", "Bin Number": "025", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444178781507105, 34.064946191173682, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3026DL", "Stream": "Landfill", "Bin Number": "026", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444175995244194, 34.064963181775703, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3027DC", "Stream": "Compost", "Bin Number": "027", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444178539486998, 34.064972274797171, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3028DR", "Stream": "Recycle", "Bin Number": "028", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443510573548807, 34.065007683662962, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3029DC", "Stream": "Compost", "Bin Number": "029", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443510760924099, 34.06500966482929, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3030DL", "Stream": "Landfill", "Bin Number": "030", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443510760924099, 34.06500966482929, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3031FR", "Stream": "Recycle", "Bin Number": "031", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445190773092705, 34.065233362524481, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3032FL", "Stream": "Landfill", "Bin Number": "032", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445182242941698, 34.065233850226193, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3033FL", "Stream": "Landfill", "Bin Number": "033", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442652722268605, 34.06535348613923, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3034FR", "Stream": "Recycle", "Bin Number": "034", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442652722268605, 34.06535348613923, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3037FR", "Stream": "Recycle", "Bin Number": "037", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443601726880004, 34.065472902431907, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3038FL", "Stream": "Landfill", "Bin Number": "038", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443593584656099, 34.065473521367799, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3039FL", "Stream": "Landfill", "Bin Number": "039", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4428030101367, 34.065476511438341, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3040FR", "Stream": "Recycle", "Bin Number": "040", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442787812795103, 34.065476572539687, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3042FL", "Stream": "Landfill", "Bin Number": "042", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441717273824807, 34.065517606363159, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3043FR", "Stream": "Recycle", "Bin Number": "043", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441717273824807, 34.065517606363159, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3044FL", "Stream": "Landfill", "Bin Number": "044", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442630767798804, 34.065615002047473, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3045FR", "Stream": "Recycle", "Bin Number": "045", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442639863656396, 34.065616332704693, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3046FL", "Stream": "Landfill", "Bin Number": "046", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445555070314299, 34.06563441932839, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3047FR", "Stream": "Recycle", "Bin Number": "047", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445546439705893, 34.065634540855939, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3048FL", "Stream": "Landfill", "Bin Number": "048", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444227686548004, 34.065660418189147, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3049FR", "Stream": "Recycle", "Bin Number": "049", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444222967074893, 34.065661882695217, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3050FL", "Stream": "Landfill", "Bin Number": "050", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445162575455896, 34.065732305177733, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3051FR", "Stream": "Recycle", "Bin Number": "051", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445162542404105, 34.065736585965936, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3055FL", "Stream": "Landfill", "Bin Number": "055", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.447454552360696, 34.065881206757531, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3056FR", "Stream": "Recycle", "Bin Number": "056", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.447434593812105, 34.065883838602659, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3060FL", "Stream": "Landfill", "Bin Number": "060", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441875427296097, 34.066068717983057, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3061FR", "Stream": "Recycle", "Bin Number": "061", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4418755129971, 34.066072484157559, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3070FR", "Stream": "Recycle", "Bin Number": "070", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4474085266977, 34.066157943318778, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3071FL", "Stream": "Landfill", "Bin Number": "071", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.447406390951798, 34.06616560706442, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3085FL", "Stream": "Landfill", "Bin Number": "085", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445373952092496, 34.066601949807882, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3086FR", "Stream": "Recycle", "Bin Number": "086", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.445381602882804, 34.066602151920343, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3087FR", "Stream": "Recycle", "Bin Number": "087", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444402017901893, 34.066923727035267, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3088FL", "Stream": "Landfill", "Bin Number": "088", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444382751536295, 34.066925855607501, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3092FR", "Stream": "Recycle", "Bin Number": "092", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441359556722503, 34.067103705764318, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3093FL", "Stream": "Landfill", "Bin Number": "093", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441367371484105, 34.067104475907499, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3094FR", "Stream": "Recycle", "Bin Number": "094", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4449130026549, 34.067157867293133, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3095FL", "Stream": "Landfill", "Bin Number": "095", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444921207978993, 34.067158062923824, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3096FR", "Stream": "Recycle", "Bin Number": "096", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442186170432095, 34.067336803177533, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3097FL", "Stream": "Landfill", "Bin Number": "097", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442195239830298, 34.067337638046673, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3098FR", "Stream": "Recycle", "Bin Number": "098", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442574688152007, 34.067415654278683, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3099FL", "Stream": "Landfill", "Bin Number": "099", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442572637764499, 34.067456378092253, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3100FR", "Stream": "Recycle", "Bin Number": "100", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443266885464595, 34.067479579714963, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3101FL", "Stream": "Landfill", "Bin Number": "101", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443263044172397, 34.067481333121172, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3102FL", "Stream": "Landfill", "Bin Number": "102", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443704795891193, 34.067485878792162, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3103FR", "Stream": "Recycle", "Bin Number": "103", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443704795891193, 34.067485878792162, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3104FL", "Stream": "Landfill", "Bin Number": "104", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440418720009802, 34.067488653274758, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3105FR", "Stream": "Recycle", "Bin Number": "105", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440426703438703, 34.06748882183701, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3106DC", "Stream": "Compost", "Bin Number": "106", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441896622707304, 34.067495413830663, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3107DL", "Stream": "Landfill", "Bin Number": "107", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441912728564503, 34.067511472274688, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3108DR", "Stream": "Recycle", "Bin Number": "108", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441917587916805, 34.067521948501373, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3109FR", "Stream": "Recycle", "Bin Number": "109", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440751394485801, 34.067653340289787, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3110FL", "Stream": "Landfill", "Bin Number": "110", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440756218868799, 34.06765344157521, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3111FR", "Stream": "Recycle", "Bin Number": "111", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444709123481402, 34.067822824985527, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3112FL", "Stream": "Landfill", "Bin Number": "112", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444709725411002, 34.067824640154967, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3113FL", "Stream": "Landfill", "Bin Number": "113", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440569684462702, 34.067939249775371, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3114FR", "Stream": "Recycle", "Bin Number": "114", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440569656784902, 34.067945488470777, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3115FR", "Stream": "Recycle", "Bin Number": "115", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440286580699905, 34.067986325430859, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3116FL", "Stream": "Landfill", "Bin Number": "116", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440280246420798, 34.067987264750002, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3117FL", "Stream": "Landfill", "Bin Number": "117", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440231302517404, 34.068382602673793, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3118FR", "Stream": "Recycle", "Bin Number": "118", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440231302517404, 34.068382602673793, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3119FR", "Stream": "Recycle", "Bin Number": "119", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442528498905006, 34.068440837999383, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3120FL", "Stream": "Landfill", "Bin Number": "120", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442528445599194, 34.068450314222368, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3121AC", "Stream": "Compost", "Bin Number": "121", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442519715204298, 34.068580723022627, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3122AS", "Stream": "Landfill", "Bin Number": "122", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442514830841503, 34.068581977214087, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3123AR", "Stream": "Recycle", "Bin Number": "123", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442519429473194, 34.068582023731508, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3126FR", "Stream": "Recycle", "Bin Number": "126", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441929029023299, 34.068613022710529, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3127FL", "Stream": "Landfill", "Bin Number": "127", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441933683825596, 34.068645998197518, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3130DR", "Stream": "Recycle", "Bin Number": "130", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443054404658795, 34.068956770489038, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3131DL", "Stream": "Landfill", "Bin Number": "131", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443038434268303, 34.06898320984746, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3132DC", "Stream": "Compost", "Bin Number": "132", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443032488718401, 34.06898511415141, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3133FR", "Stream": "Recycle", "Bin Number": "133", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442167359221799, 34.068985672394582, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3134FL", "Stream": "Landfill", "Bin Number": "134", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442155400142397, 34.068986158229123, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3137FL", "Stream": "Landfill", "Bin Number": "137", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444520647739097, 34.069005135496681, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3138FL", "Stream": "Landfill", "Bin Number": "138", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441930684406699, 34.069008007230437, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3139FR", "Stream": "Recycle", "Bin Number": "139", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444513378673804, 34.069014442076373, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3140FR", "Stream": "Recycle", "Bin Number": "140", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441937780125997, 34.0690154235958, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3143FR", "Stream": "Recycle", "Bin Number": "143", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442557346428899, 34.069116485988999, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3144FL", "Stream": "Landfill", "Bin Number": "144", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442536299051099, 34.069155897867503, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3145FL", "Stream": "Landfill", "Bin Number": "145", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444613988116203, 34.069170465090927, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3146FR", "Stream": "Recycle", "Bin Number": "146", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4446067326529, 34.069181721715317, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3147FR", "Stream": "Recycle", "Bin Number": "147", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440493828532396, 34.069239598097781, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3148FL", "Stream": "Landfill", "Bin Number": "148", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440537364797095, 34.069246957914203, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3149DC", "Stream": "Compost", "Bin Number": "149", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4419351456458, 34.06927094656259, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3150DL", "Stream": "Landfill", "Bin Number": "150", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441942316392499, 34.069274094602797, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3151FL", "Stream": "Landfill", "Bin Number": "151", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444798501386401, 34.069276746866933, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3152FR", "Stream": "Recycle", "Bin Number": "152", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444798501386401, 34.069276746866933, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3153DR", "Stream": "Recycle", "Bin Number": "153", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441938446681505, 34.069289905813058, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3154FR", "Stream": "Recycle", "Bin Number": "154", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441866841609695, 34.069446954214797, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3155FL", "Stream": "Landfill", "Bin Number": "155", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441840817796901, 34.0694490675453, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3157FR", "Stream": "Recycle", "Bin Number": "157", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444231292900398, 34.069589594021437, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3158FL", "Stream": "Landfill", "Bin Number": "158", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.444220863684805, 34.069589993416898, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3160FR", "Stream": "Recycle", "Bin Number": "160", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4434920603168, 34.069732169039753, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3161FL", "Stream": "Landfill", "Bin Number": "161", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443492345063405, 34.069738637775707, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3162FL", "Stream": "Landfill", "Bin Number": "162", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441633003976094, 34.069787881327237, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3163FR", "Stream": "Recycle", "Bin Number": "163", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4416112425195, 34.069788931713532, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3164FR", "Stream": "Recycle", "Bin Number": "164", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441756445770693, 34.069793775459217, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3165FL", "Stream": "Landfill", "Bin Number": "165", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4417389687396, 34.069794258852447, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3166DL", "Stream": "Landfill", "Bin Number": "166", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443133310491206, 34.069796231508839, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3167DR", "Stream": "Recycle", "Bin Number": "167", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443138891807905, 34.069798562690288, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3168DC", "Stream": "Compost", "Bin Number": "168", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443126059572407, 34.06979963615219, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3169FR", "Stream": "Recycle", "Bin Number": "169", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440523595893097, 34.069895408682839, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3170FL", "Stream": "Landfill", "Bin Number": "170", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440508081392395, 34.069898585620052, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3171DL", "Stream": "Landfill", "Bin Number": "171", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442572518068502, 34.069949953786939, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3172DR", "Stream": "Recycle", "Bin Number": "172", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442564274770604, 34.069950907330323, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3173DC", "Stream": "Compost", "Bin Number": "173", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442570589841495, 34.06995169062376, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3174ML", "Stream": "Landfill", "Bin Number": "174", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441639055830606, 34.070057898978078, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3175FL", "Stream": "Landfill", "Bin Number": "175", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440881572136107, 34.070233930216617, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3176FR", "Stream": "Recycle", "Bin Number": "176", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440892573354901, 34.070244757129458, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3177FR", "Stream": "Recycle", "Bin Number": "177", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.439922793880896, 34.070414590944353, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3178FL", "Stream": "Landfill", "Bin Number": "178", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.439872629113907, 34.07041685858664, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3179FR", "Stream": "Recycle", "Bin Number": "179", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440742053002495, 34.070708715737787, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3180FL", "Stream": "Landfill", "Bin Number": "180", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440742271516797, 34.070711893680418, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3184DL", "Stream": "Landfill", "Bin Number": "184", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441112152651797, 34.070914776890938, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3185DC", "Stream": "Compost", "Bin Number": "185", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441104978660206, 34.07091681817748, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3186DR", "Stream": "Recycle", "Bin Number": "186", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4411099241496, 34.07091933598867, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3187AC", "Stream": "Compost", "Bin Number": "187", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4429222911115, 34.07094258114622, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3188AS", "Stream": "Landfill", "Bin Number": "188", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4429222911115, 34.07094258114622, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3189AR", "Stream": "Recycle", "Bin Number": "189", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442926742697495, 34.070948856484257, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3190AR", "Stream": "Recycle", "Bin Number": "190", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440662399330805, 34.071397656243349, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3191AS", "Stream": "Landfill", "Bin Number": "191", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440663496945803, 34.071399512551999, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3192AC", "Stream": "Compost", "Bin Number": "192", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.44066551041, 34.071400413439576, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3074AC", "Stream": "Compost", "Bin Number": "074", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442927077307502, 34.066170113225851, 119.100976601274496 ] } },
	{ "type": "Feature", "properties": { "Name": "3067AC", "Stream": "Compost", "Bin Number": "067", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443236740672106, 34.06613859448823, 119.041392360841897 ] } },
	{ "type": "Feature", "properties": { "Name": "3072AS", "Stream": "Landfill", "Bin Number": "072", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442932507454699, 34.066170101131419, 119.050578330518505 ] } },
	{ "type": "Feature", "properties": { "Name": "3068AS", "Stream": "Landfill", "Bin Number": "068", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443236740672106, 34.06613859448823, 119.041387639128004 ] } },
	{ "type": "Feature", "properties": { "Name": "3075AR", "Stream": "Recycle", "Bin Number": "075", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442927077307502, 34.066170113225851, 119.100986044702196 ] } },
	{ "type": "Feature", "properties": { "Name": "3069AR", "Stream": "Recycle", "Bin Number": "069", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443254596063696, 34.066141044695968, 119.159742185180704 ] } },
	{ "type": "Feature", "properties": { "Name": "3064BC", "Stream": "Compost", "Bin Number": "064", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443346474083995, 34.06611896464338, 119.555551589631705 ] } },
	{ "type": "Feature", "properties": { "Name": "3082BC", "Stream": "Compost", "Bin Number": "082", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443347887688404, 34.06626671196895, 120.179714105717494 ] } },
	{ "type": "Feature", "properties": { "Name": "3077BC", "Stream": "Compost", "Bin Number": "077", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442658122618397, 34.066232261208768, 122.260118274576598 ] } },
	{ "type": "Feature", "properties": { "Name": "3057BC", "Stream": "Compost", "Bin Number": "057", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442679446252697, 34.066048333954697, 120.615843367674799 ] } },
	{ "type": "Feature", "properties": { "Name": "3073BC", "Stream": "Compost", "Bin Number": "073", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442932507454699, 34.066170101131419, 119.050587772529994 ] } },
	{ "type": "Feature", "properties": { "Name": "3076BS", "Stream": "Landfill", "Bin Number": "076", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442710858814394, 34.066228331848357, 119.598197283507503 ] } },
	{ "type": "Feature", "properties": { "Name": "3062BS", "Stream": "Landfill", "Bin Number": "062", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443330204474705, 34.066111642700307, 119.826954189483402 ] } },
	{ "type": "Feature", "properties": { "Name": "3079BS", "Stream": "Landfill", "Bin Number": "079", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443330204461205, 34.066259098479343, 120.556363116829203 ] } },
	{ "type": "Feature", "properties": { "Name": "3058BS", "Stream": "Landfill", "Bin Number": "058", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442679446252697, 34.066048333954697, 120.615857532816406 ] } },
	{ "type": "Feature", "properties": { "Name": "3065BS", "Stream": "Landfill", "Bin Number": "065", "Stream Character": "S", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443034888541206, 34.066122479286221, 119.121139300883399 ] } },
	{ "type": "Feature", "properties": { "Name": "3063BR", "Stream": "Recycle", "Bin Number": "063", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4433435167429, 34.066118963947893, 119.545579735011898 ] } },
	{ "type": "Feature", "properties": { "Name": "3080BR", "Stream": "Recycle", "Bin Number": "080", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443355248583501, 34.066263012376332, 120.227192591271205 ] } },
	{ "type": "Feature", "properties": { "Name": "3078BR", "Stream": "Recycle", "Bin Number": "078", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442682897720999, 34.066239591088689, 122.260103016104694 ] } },
	{ "type": "Feature", "properties": { "Name": "3059BR", "Stream": "Recycle", "Bin Number": "059", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442679446252697, 34.066048333954697, 120.615843367674799 ] } },
	{ "type": "Feature", "properties": { "Name": "3066BR", "Stream": "Recycle", "Bin Number": "066", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443027767927006, 34.066134366057597, 119.065805396009594 ] } },
	{ "type": "Feature", "properties": { "Name": "3183DC", "Stream": "Compost", "Bin Number": "183", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442544467382504, 34.070800222577837, 145.776410604355704 ] } },
	{ "type": "Feature", "properties": { "Name": "3091DC", "Stream": "Compost", "Bin Number": "091", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4402493954791, 34.067002819720642, 123.196929678302894 ] } },
	{ "type": "Feature", "properties": { "Name": "3052DC", "Stream": "Compost", "Bin Number": "052", "Stream Character": "C", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442358501312995, 34.06575300227324, 119.104092306444699 ] } },
	{ "type": "Feature", "properties": { "Name": "3181DL", "Stream": "Landfill", "Bin Number": "181", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4425681890296, 34.070766528334246, 148.726309305824486 ] } },
	{ "type": "Feature", "properties": { "Name": "3090DL", "Stream": "Landfill", "Bin Number": "090", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4402573457334, 34.067000059350399, 123.207127180993595 ] } },
	{ "type": "Feature", "properties": { "Name": "3054DL", "Stream": "Landfill", "Bin Number": "054", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442356970041104, 34.065754980041127, 119.114499561430605 ] } },
	{ "type": "Feature", "properties": { "Name": "3182DR", "Stream": "Recycle", "Bin Number": "182", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442555728414703, 34.070782777131413, 148.190498741710087 ] } },
	{ "type": "Feature", "properties": { "Name": "3089DR", "Stream": "Recycle", "Bin Number": "089", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440244856068105, 34.066995765794957, 123.792549582839399 ] } },
	{ "type": "Feature", "properties": { "Name": "3053DR", "Stream": "Recycle", "Bin Number": "053", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442358501312995, 34.06575300227324, 119.104115913597795 ] } },
	{ "type": "Feature", "properties": { "Name": "3159FL", "Stream": "Landfill", "Bin Number": "159", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443474451121105, 34.069601917054399, 131.876501291030905 ] } },
	{ "type": "Feature", "properties": { "Name": "3142FL", "Stream": "Landfill", "Bin Number": "142", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441559000377893, 34.069107154604119, 132.161596750596203 ] } },
	{ "type": "Feature", "properties": { "Name": "3135FL", "Stream": "Landfill", "Bin Number": "135", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441577373227403, 34.069001149032367, 131.863268695033412 ] } },
	{ "type": "Feature", "properties": { "Name": "3128FL", "Stream": "Landfill", "Bin Number": "128", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441555494084398, 34.068734444260961, 154.28764623810261 ] } },
	{ "type": "Feature", "properties": { "Name": "3124FL", "Stream": "Landfill", "Bin Number": "124", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.440499701101899, 34.068587202417923, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3156FR", "Stream": "Recycle", "Bin Number": "156", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.443469722230304, 34.069578532708967, 131.651078590578891 ] } },
	{ "type": "Feature", "properties": { "Name": "3141FR", "Stream": "Recycle", "Bin Number": "141", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441566335546796, 34.069102014084052, 132.456940470567901 ] } },
	{ "type": "Feature", "properties": { "Name": "3136FR", "Stream": "Recycle", "Bin Number": "136", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441577373227403, 34.069001149032367, 131.863247448737297 ] } },
	{ "type": "Feature", "properties": { "Name": "3129FR", "Stream": "Recycle", "Bin Number": "129", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441559171248002, 34.068749532752612, 155.156337029929887 ] } },
	{ "type": "Feature", "properties": { "Name": "3125FR", "Stream": "Recycle", "Bin Number": "125", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.4404890810371, 34.068595593431702, 125.322574350814307 ] } },
	{ "type": "Feature", "properties": { "Name": "3084ML", "Stream": "Landfill", "Bin Number": "084", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441913554397601, 34.066552995847417, 0.0 ] } },
	{ "type": "Feature", "properties": { "Name": "3083ML", "Stream": "Landfill", "Bin Number": "083", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442153455756099, 34.066548030084917, 141.211623065096603 ] } },
	{ "type": "Feature", "properties": { "Name": "3081ML", "Stream": "Landfill", "Bin Number": "081", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442394233761505, 34.066263914704351, 122.023654599709403 ] } },
	{ "type": "Feature", "properties": { "Name": "3041ML", "Stream": "Landfill", "Bin Number": "041", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.441866136874694, 34.06551008335871, 117.642518354519197 ] } },
	{ "type": "Feature", "properties": { "Name": "3036NL", "Stream": "Landfill", "Bin Number": "036", "Stream Character": "L", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442710166940401, 34.065469796712463, 118.220143082444096 ] } },
	{ "type": "Feature", "properties": { "Name": "3035NR", "Stream": "Recycle", "Bin Number": "035", "Stream Character": "R", "Zone": "3" }, "geometry": { "type": "Point", "coordinates": [ -118.442719636796099, 34.065464421283039, 127.295146046695194 ] } }
	]
	}
	
binDataInternal = this.binData.features.map(feature => {
	return {
		newFieldType: feature.geometry.type == 'Point' ? 'geoPoint' : feature.geometry.type == 'Polygon' ? 'geoRegion' : 'geoLine',
		coordinates: feature.geometry.coordinates,
		rowData: feature.properties
	};
});

zoneData = [{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-118.4407979811624,34.07094008068786,132.9411557407538],[-118.440769967077,34.07135508316826,133.8039218992566],[-118.4396425534976,34.07137338414515,132.8245375321593],[-118.439638982967,34.07135443293443,132.6698951873144],[-118.4396481193594,34.07127116768019,132.6513004079298],[-118.4396478744917,34.07046069938963,131.414837077292],[-118.439647798857,34.07021031034436,131.0281258047762],[-118.4398675310202,34.06993711277086,130.821462155835],[-118.4395287858103,34.06974771230656,131.0393940635194],[-118.4389598010597,34.06965496321549,129.560244767126],[-118.4389134189172,34.06987471902261,129.0137474188708],[-118.4388282117041,34.07032957119211,126.5378206787851],[-118.4386789344085,34.07059595342323,124.8195536352186],[-118.4384830142633,34.07077917844801,123.1366855747721],[-118.4379873906208,34.07117618304771,124.6318902222835],[-118.4375719406561,34.0716111594343,125.1675955291297],[-118.4374329636657,34.07184903650337,124.5201640715601],[-118.4373480700726,34.07207543677299,123.5618986904975],[-118.4373217662195,34.07229296426596,124.0710017025545],[-118.4372979942251,34.07248842920797,125.5744072747848],[-118.4373089876486,34.07267183433905,127.2263672439895],[-118.4373530144794,34.07283147229673,128.4171643408001],[-118.4374729402218,34.07308322938007,130.7255594161367],[-118.4377374095443,34.07367605642457,136.9662468473418],[-118.4380140384112,34.07417517068898,140.6434254593222],[-118.4385229801519,34.075421428124,144.5616831492598],[-118.4387225077873,34.07575381247693,142.7186945788753],[-118.4387300380579,34.07599026954297,141.3850756011361],[-118.4387094373965,34.07634577295031,139.4467599539261],[-118.4387167096048,34.07666669749909,141.2786149853636],[-118.4388753774868,34.07689132029727,142.0887503540688],[-118.4390405883549,34.07718844611551,144.6953339806226],[-118.4390490670491,34.07749559428249,146.96186981073],[-118.4391098975966,34.07791868412344,149.4494221058902],[-118.4394566463499,34.07823603377749,151.1960381063795],[-118.4397860644243,34.07803333845492,150.8430496142429],[-118.4404908689566,34.07760301452013,146.9549397254972],[-118.4410761951296,34.07748482749322,143.4180850394257],[-118.4417321558717,34.07749184947477,139.7247933332091],[-118.4425189308218,34.07748024960306,135.3125112836144],[-118.4428431603983,34.07740477125921,133.5332650144842],[-118.4429531151376,34.07713681741314,132.6686518995204],[-118.4430799918386,34.0767578236319,133.7177271785338],[-118.4430381552118,34.07641154046094,135.202514468411],[-118.4428975204897,34.07611478913588,136.9778119587342],[-118.442699611802,34.07586913914521,137.7579279593463],[-118.4423933291581,34.07540354826399,139.1007613795763],[-118.4423924122864,34.07502061148831,140.084713731231],[-118.4425912116659,34.07476069354175,137.8880506816525],[-118.4426105543272,34.07345552506232,124.9466803048041],[-118.4427298168588,34.07340547299812,125.2331519740755],[-118.4426578540156,34.07095636478987,133.8433481769989],[-118.4407979811624,34.07094008068786,132.9411557407538]]]},"properties":{"name":"Zone 1","styleUrl":"#__managed_style_0E634B84241AD7B63C3B","styleMapHash":{"normal":"#__managed_style_158A8BF1B11AD7B63C3B","highlight":"#__managed_style_26875313661AD7B63C3B"}},"id":"05792957C119C63A58E3"},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-118.4431973491498,34.07682283966779,132.8071431951127],[-118.4434783656756,34.07684437088093,130.8073242870595],[-118.4437588091407,34.07675231441724,130.4474813155738],[-118.4439553936357,34.07664848960562,130.1261108234409],[-118.4441447976495,34.07646880288883,129.9928786558568],[-118.4442444398677,34.07626667113174,129.2071185250162],[-118.44430811296,34.07598801015408,128.941975677991],[-118.44437310087,34.07572109083115,128.083579963958],[-118.4444596481449,34.07523794392269,127.0877179774399],[-118.4445384897776,34.0747771002053,126.469390938648],[-118.444723439035,34.07382663290556,123.9780442806268],[-118.4447824967227,34.07363814954544,123.6315990211426],[-118.4449442721784,34.0735093844979,123.0043404893447],[-118.4448458559582,34.07318565172339,122.3609144771529],[-118.4447756137081,34.07278187296269,117.9657473673022],[-118.4449156655438,34.07278099220492,120.5626397992939],[-118.4449024217514,34.07202600585779,119.8287250581919],[-118.4448943591855,34.07189744576139,119.9815061473097],[-118.4446757502415,34.07189551195426,120.1570442622331],[-118.4446783900019,34.07125262169262,118.4275838966783],[-118.4450322949546,34.07103991468977,117.8274946465037],[-118.4461682586432,34.07100372265226,116.5911236669427],[-118.4476469315016,34.07098963541908,116.6175241791136],[-118.4479795203516,34.07099144635885,118.3092599022157],[-118.4483877252898,34.07080495438444,122.3389209257708],[-118.4486254928512,34.07078341449286,124.5879911262107],[-118.4487885294861,34.07073239721816,125.8929174765892],[-118.4492837192045,34.07070407069162,129.5905910915861],[-118.4494608329576,34.07117283325207,132.3723276625001],[-118.4494963524875,34.071804924129,133.6046105713143],[-118.4494896487031,34.07242407170757,134.2487414547049],[-118.4492856107018,34.0729012839858,134.125664211916],[-118.44909810174,34.07308522428291,133.0535610104166],[-118.4489680347777,34.07315046949903,131.1465646884939],[-118.4493285658649,34.07379565225907,135.9800919560339],[-118.4498091251557,34.07458137936986,140.1195283344148],[-118.4501318255854,34.07507734565512,143.9822627609751],[-118.4505078796525,34.07548752390866,148.1720327650837],[-118.4508730882662,34.07567641214655,150.0045404572916],[-118.4512731568182,34.07585232312694,152.702969548278],[-118.4502942063424,34.07528777632114,146.0887660270062],[-118.4512567807543,34.07496896042466,150.656059217454],[-118.4510295488029,34.07451322092255,148.9939197057428],[-118.4501375038424,34.0748546374528,146.2135425397927],[-118.4497648170805,34.0741937262571,140.4846689024426],[-118.4493177125042,34.07347791563145,134.4630330448364],[-118.4492357296807,34.07321902829935,132.1804645460836],[-118.4495676413447,34.07297242454278,135.2424811008168],[-118.4496136696682,34.07270778522891,134.3291868788227],[-118.4496447403531,34.07237410206665,134.511395674902],[-118.449634276964,34.07194233975139,134.2448626627982],[-118.4496597094774,34.07136406653971,133.4585341601827],[-118.4494259387868,34.07076738257187,129.9177942639448],[-118.4490551397025,34.07018330941129,125.6085756198969],[-118.448858692818,34.06988875365155,122.6074034337102],[-118.4488158510649,34.06949374655934,118.1606651085416],[-118.4486781005444,34.06928073216437,116.5213195930572],[-118.4484416472303,34.06914588523559,113.9054271796962],[-118.4484197343609,34.06876918856784,111.7017205066192],[-118.4483807509723,34.06863831780822,111.6734857188954],[-118.4449813474146,34.06865470036994,113.3001512159502],[-118.4450233891087,34.06889803348932,114.210975617452],[-118.4451743036128,34.06908547358517,115.0131734703846],[-118.4451695045726,34.06966156469656,115.6640146238667],[-118.44485873281,34.06966476554007,115.6776526704847],[-118.4447047290252,34.06966628175299,116.2403841375612],[-118.4446842354184,34.06975781989769,116.6317944363448],[-118.4430941918401,34.06976346166215,128.8271929954985],[-118.4431271106041,34.07094971152983,127.9912186819386],[-118.4426544129309,34.0709536795104,133.5297867831008],[-118.4427167664615,34.07337019276505,125.3521924921959],[-118.4426092359626,34.07345265035925,124.9587538238552],[-118.4426081241458,34.07473094361161,137.5127948357656],[-118.4423745759542,34.07503790918106,140.2428938655715],[-118.4424049569541,34.07541889159796,139.0290872635825],[-118.4428866802172,34.07607970270065,137.026033876553],[-118.4429943225882,34.07630419055499,135.8938100278959],[-118.4430736399581,34.07657714978534,134.6537502323909],[-118.4431973491498,34.07682283966779,132.8071431951127]]]},"properties":{"name":"Zone 2","styleUrl":"#__managed_style_064D29B4071AD7B63C3C","styleMapHash":{"normal":"#__managed_style_1614839A0B1AD7B63C3C","highlight":"#__managed_style_24557DE0DF1AD7B63C3C"}},"id":"07355CDADA19C64354B9"},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-118.4389583480145,34.06965216026453,129.8503477383961],[-118.4395062136812,34.06974060757683,130.8284084218162],[-118.4398735155045,34.0699372339937,130.631740442212],[-118.4396584036441,34.07019862979357,131.0866508219073],[-118.4396536085899,34.07138640287562,133.6695450957993],[-118.4407701101648,34.07140838340914,133.6394825031244],[-118.4407964347534,34.07094637573224,133.926849801858],[-118.4431219586771,34.07094988081912,128.7634015196513],[-118.4431189940002,34.06982542880708,129.9062981293935],[-118.4446820671938,34.06975858437736,116.5613986716202],[-118.4447157929866,34.06966383545558,116.4812034577794],[-118.4451672429423,34.06966305888876,115.9611933990572],[-118.4451720104273,34.06908583215531,115.0132117465263],[-118.445015438494,34.0688904031017,114.1822302916091],[-118.4451102506718,34.06840052591993,112.8263937034012],[-118.4451998524995,34.06789236606338,111.6365412281561],[-118.4452271620311,34.06770479381765,111.1729143749382],[-118.4453206057147,34.06706477718156,109.7410701797122],[-118.4454448917508,34.06614241644773,107.3985528287033],[-118.4455832232766,34.06413518304737,103.4275681868287],[-118.4456325903022,34.06396737089551,102.7319734457871],[-118.4460275661965,34.06393827214622,102.2728040082078],[-118.4464885574718,34.0638452568467,102.3616632375794],[-118.446446120128,34.06389352587738,103.2667946645802],[-118.4463861080336,34.06429398388657,104.1719260915809],[-118.4475296997359,34.06425132942148,104.1175721525208],[-118.4475585116239,34.06368341597037,101.7435813842332],[-118.4442002032681,34.06384580656852,105.9230208618263],[-118.4424841831187,34.06382907992908,109.7190093320911],[-118.4421180450018,34.06394884064222,108.7699436260047],[-118.4421360714814,34.0641647595852,111.2151964585738],[-118.4420246107476,34.06418145257779,111.6340698798435],[-118.4419005360767,34.06424744320801,112.2488076529139],[-118.4418286925561,34.06436781481042,112.5577444409525],[-118.4417848930403,34.06455913353049,113.5189547465134],[-118.4417294689695,34.0648532414552,115.0282796843793],[-118.4417312131247,34.0652476341161,118.2727917858368],[-118.44172348231,34.06577936566057,117.8156437846227],[-118.4417497531251,34.06634470839105,118.4456548105413],[-118.4414774572035,34.06635708998543,116.5774090920903],[-118.4414063910697,34.06644989978285,115.6138687771528],[-118.4414425669785,34.06664654472552,116.2969142146915],[-118.44140043534,34.06699247832584,121.8144806041714],[-118.4410398939708,34.06702100943655,122.1235891177936],[-118.440740345998,34.06701919755102,122.1637849274839],[-118.4405094412409,34.06678360235984,122.0621680169002],[-118.4403858532328,34.06660541628936,120.7612972781611],[-118.4398716481656,34.0663934343923,116.3642145151084],[-118.4394613086818,34.06687015384718,120.3893997608886],[-118.4392124507054,34.06732972670605,123.951254994783],[-118.4392126422236,34.06792060628172,129.5909913154231],[-118.4392480582076,34.06843400229707,131.3633774437812],[-118.4391773376589,34.06890261550086,131.1892693573136],[-118.4390534705856,34.06928362151245,130.3030999998124],[-118.4389583480145,34.06965216026453,129.8503477383961]]]},"properties":{"name":"Zone 3","styleUrl":"#__managed_style_07C1B7034D1AD7B63C3E","styleMapHash":{"normal":"#__managed_style_1EB94644991AD7B63C3E","highlight":"#__managed_style_2724481A311AD7B63C3E"}},"id":"05B0E85B0719C64970D0"}]


layerType = 1;
viewType = 1;

private map;

changeView(view) {
	if(view === 2) {
		this.viewType = 2;
		this.invalidate();
	} else {
		this.viewType = 1;
	}
}

private initMap(): void {
	this.map = L.map('map', {
		center: [ 34.06551008335871, -118.4418661368747 ],
		zoom: 15
	});

	const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

	L.polygon(this.zoneData[0].geometry.coordinates[0].map(coord => {
		return [coord[1], coord[0]]
	}), { color: 'red' }).addTo(this.map);

	L.polygon(this.zoneData[1].geometry.coordinates[0].map(coord => {
		return [coord[1], coord[0]]
	}), { color: 'blue' }).addTo(this.map);

	L.polygon(this.zoneData[2].geometry.coordinates[0].map(coord => {
		return [coord[1], coord[0]]
	}), { color: 'green' }).addTo(this.map);

	tiles.addTo(this.map);

	L.marker([34.06551008335871, -118.4418661368747]).addTo(this.map)

	this.binDataInternal.forEach(data => {
		L.marker([data.coordinates[1], data.coordinates[0]]).addTo(this.map);
	})


}

// Must invalidate the size because a bug where the tiles do not render properly on first load
private invalidate() {
	setTimeout(() => {
		this.map.invalidateSize(true);
	 }, 1);
}

// Layer handling
layers = ['Victor Stanley Waste Bins', 'Campus Zone'];
layerDropped(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.layers, event.previousIndex, event.currentIndex);
}
 
}
