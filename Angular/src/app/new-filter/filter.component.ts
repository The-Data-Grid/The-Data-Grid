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
 styleUrls: ['./filter.component.css', '../../tailwind.css']
})

export class NewFilterComponent implements OnInit, AfterViewInit {

 constructor(private apiService: ApiService,
   public datepipe: DatePipe,
   private setupObjectService: SetupObjectService,
   private tableObjectService: TableObjectService) { }

@ViewChild('paginator') paginator: MatPaginator;

ngOnInit() {
	// Layout Init
	// ==========================================
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
	
	document.addEventListener('scroll', this.setScrollPos);
	this.setScrollPos();

	// Data Formatting
	// ==========================================
	Object.entries(this.TDGOperatorToBuilderOperatorLookup).forEach(arr => {
		this.builderOperatorToTDGOperatorLookup[arr[1]] = arr[0];
	});

	// Data Waterfall
	// ==========================================

	this.getSetupObjects();
	this.expandFilter(1, true);

}

ngAfterViewInit(): void {
	this.initMap();
}

// =================================================
// GLOBAL STATE
// =================================================

// 1 = Table, 2 = Map
viewType = 1;

queryType = 'Observations';
databases = [
	{
		id: 'ucla-audits',
		name: 'UCLA Audits'
	},
	{
		id: 'us-census',
		name: 'US Census'
	}
]
selectedDatabase = 0;
onDatabaseChange() {

}
changeViewType(e) {
	let newViewType = e.index + 1;

	this.viewType = newViewType;
	this.getQueryBuilder(newViewType)

	// Table View
	if(newViewType == 1) {
		this.expandFilter(1, true)
		this.expandFilter(2, false)
	}

	// Map view
	else {
		this.expandFilter(1, false)
		this.expandFilter(2, true)
	}
}


// =================================================
// QUERY BUILDER
// =================================================

isFirstQuery = true;
validOperatorLookup = {
    'text': [
        'equals', 'textContainsCase', 'textContainsNoCase' 
    ],
    'decimal': [
        'equals', 'lessOrEqual', 'less', 'greater', 'greaterOrEqual'
    ],
    'wholeNumber': [
        'equals', 'lessOrEqual', 'less', 'greater', 'greaterOrEqual'
    ],
    'date': [
        'equals', 'lessOrEqual', 'less', 'greater', 'greaterOrEqual'
    ],
    'checkbox': [
        'equals'
    ],
    'checkboxList': [
        'contains', 'containedBy', 'overlaps'
    ],
    'dropdown': [
        'equals'
    ],
    'geoPoint': ['geoContains', 'geoCrosses', 'geoDisjoint', 'geoWithinDistance', 'geoEquals', 'geoIntersects', 'geoTouches', 'geoOverlaps', 'geoWithin'],
    'geoLine': ['geoContains', 'geoCrosses', 'geoDisjoint', 'geoWithinDistance', 'geoEquals', 'geoIntersects', 'geoTouches', 'geoOverlaps', 'geoWithin'],
    'geoRegion': ['geoContains', 'geoCrosses', 'geoDisjoint', 'geoWithinDistance', 'geoEquals', 'geoIntersects', 'geoTouches', 'geoOverlaps', 'geoWithin']
};
TDGOperatorToBuilderOperatorLookup = {
	equals: 'equals',
	textContainsCase: 'contains (case sensitive)',
	textContainsNoCase: 'contains (case insensitive)',
	less: 'less than',
	lessOrEqual: 'less than or equal to',
	greater: 'greater than',
	greaterOrEqual: 'greater than or equal to',
	contains: 'contains value(s)',
	containedBy: 'contained by value(s)',
	overlaps: 'overlaps with value(s)',
	geoContains: 'contains',
	geoCrosses: 'crosses',
	geoDisjoint: 'disjoint',
	geoWithinDistance: 'within distance',
	geoEquals: 'identical to',
	geoIntersects: 'intersects',
	geoTouches: 'touches',
	geoOverlaps: 'overlaps',
	geoWithin: 'contained by'
};
builderOperatorToTDGOperatorLookup = {};

// choose 'string' if type not in lookup
TDGSelectorTypeToBuilderTypeLookup = {
	decimal: 'double',
	wholeNumber: 'integer',
	date: 'date',
	checkbox: 'boolean'
}
TDGSelectorTypeToBuilderInputLookup = {
	text: 'text',
	decimal: 'number',
	wholeNumber: 'number',
	date: 'text', // custom
	checkbox: 'radio',
	checkboxList: 'checkbox',
	dropdown: 'select',
	geoPoint: 'text', // custom
	geoLine: 'text', // custom
	geoRegion: 'text' // custom
}
filters = [{
	id: "15",
	label: "Factor",
	type: 'string',
	input: 'select',
	values: ['YRL', 'Powell', 'Math Sciences'],
	operators: ['equals']
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

builderLookup = {
	1: 'table-builder',
	2: 'map-builder-global'
}

expandedPanelLookup = {
	'table-builder': false,
	'map-builder-global': false
}

async expandFilter(viewType: number, set: boolean) {
	if(set) {
		await new Promise(r => setTimeout(r, 100));
	}
	this.expandedPanelLookup[this.builderLookup[viewType]] = set;
}

getQueryBuilder(viewType) {
	// fill the filters
	let filters = this.filterableReturnableIDs.map((id, index) => {
		let columnObject = this.filterableColumnObjects[index];
		let out: any = {
			id,
			label: columnObject.frontendName,
			operators: this.validOperatorLookup[columnObject.selectorType].map(op => this.TDGOperatorToBuilderOperatorLookup[op]),
			type: columnObject.selectorType in this.TDGSelectorTypeToBuilderTypeLookup ? this.TDGSelectorTypeToBuilderTypeLookup[columnObject.selectorType] : 'string',
			input: this.TDGSelectorTypeToBuilderInputLookup[columnObject.selectorType]
		};
		if(columnObject.presetValues != null) {
			out.values = columnObject.presetValues;
		} else if(columnObject.selectorType == 'checkbox') {
			out.values = [true, false];
		}
		return out;
	})
	$(document).ready(() => {
		(<any>$('#' + this.builderLookup[viewType])).queryBuilder({
			plugins: [],
			filters: filters,
			operators: [
				{type: 'equals', optgroup: 'custom', nb_inputs: 1, multiple: true, apply_to: ['string', 'number', 'datetime', 'boolean']},
				{type: 'contains (case sensitive)', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'contains (case insensitive)', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'less than', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime']},
				{type: 'less than or equal to', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime']},
				{type: 'greater than', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime']},
				{type: 'greater than or equal to', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime']},
				{type: 'contains value(s)', optgroup: 'custom', nb_inputs: 1, multiple: true, apply_to: ['number', 'datetime', 'string', 'boolean']},
				{type: 'contained by value(s)', optgroup: 'custom', nb_inputs: 1, multiple: true, apply_to: ['number', 'datetime', 'string', 'boolean']},
				{type: 'overlaps with value(s)', optgroup: 'custom', nb_inputs: 1, multiple: true, apply_to: ['number', 'datetime', 'string', 'boolean']},
				{type: 'contains', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'crosses', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'disjoint', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'within distance', optgroup: 'custom', nb_inputs: 2, multiple: false, apply_to: ['string']},
				{type: 'identical to', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'intersects', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'touches', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'overlaps', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']},
				{type: 'contained by', optgroup: 'custom', nb_inputs: 1, multiple: false, apply_to: ['string']}
			],
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

getRulesQueryBuilder(target) {
	return (<any>$('#' + target)).queryBuilder('getRules', { skip_empty: true });
}

private operationMap = {
	equal: '=',
	contains: 'contains',

}
formatQueryString(rules) {
	console.log(rules)
	const builderOperatorToTDGOperatorLookup = this.builderOperatorToTDGOperatorLookup
	// Empty rule set case for no query string
	if(rules.rules.length == 0) return '';
	// Compress query logic into object
	const isGroup = (obj) => 'condition' in obj;
	let compressedRules = traverseGroup(rules)
	console.log(compressedRules)
	return encodeURIComponent(JSON.stringify(compressedRules));

	// 0 = AND, 1 = OR
	function traverseGroup(group) {
		let newGroup = [];
		newGroup.push(group.condition === 'AND' ? 0 : 1);
		for(let element of group.rules) {
			if(isGroup(element)) {
				newGroup.push(traverseGroup(element));
			} else {
				newGroup.push({
					id: element.id,
					op: builderOperatorToTDGOperatorLookup[element.operator],
					val: element.value
				});
			}
		}
		return newGroup;
	}
}

// =================================================
// API REQUESTS
// =================================================

tableData = [];
headerNames = [];
setupObject;
setupFilterObject;
allFeatures;
allItems;
filterableColumnObjects = [];
filterableReturnableIDs = [];
relevantColumnObjects = [];
currentReturnableIDs = [];
currentColumnObjectIndices = [];
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
	this.runQuery(true, 'table-builder');
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
			// format the column objects
			this.getFilterableColumnIDs(2);
			// init the query builder given the column objects
			this.getQueryBuilder(1);
			this.runQuery(false, 'table-builder');
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
			.filter(col => col.isFilterable);

	this.filterableReturnableIDs = this.currentColumnObjectIndices
			.map((columnObjectIndex, arrayIndex) => [this.setupObject.columns[columnObjectIndex], arrayIndex])
			.filter(arr => arr[0].isFilterable)
			.map(arr => this.currentReturnableIDs[arr[1]]);

	this.relevantColumnObjects = this.currentColumnObjectIndices
		.map(index => this.setupObject.columns[index]);

	this.selectedFields = this.relevantColumnObjects.map((col, i) => i)
	this.selectedSortField = null;
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

runQuery(isPaginationQuery, target) {
	this.invalidQuery = false;
	this.queryError = null;
	let queryString = '';
	if(!this.isFirstQuery) {
		const rules = this.getRulesQueryBuilder(target);
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

// =================================================
// GEOSPATIAL
// =================================================

layerType = 1;

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

	L.marker([34.06551008335871, -118.4418661368747]).addTo(this.map)

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
 




// =================================================
// BREAKPOINTS AND LAYOUT
// =================================================

isXs;
isSm;
isM;
isL;
lastKnownScrollPosition = 0;
isAtTopOfPage = true;

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

scrollToTop() {
	window.scrollTo({top: 0, behavior: 'smooth'});
}

scrollToBottom() {
	window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
}

setScrollPos() {
	this.lastKnownScrollPosition = window.scrollY;
	this.isAtTopOfPage = this.lastKnownScrollPosition == 0;
}


}