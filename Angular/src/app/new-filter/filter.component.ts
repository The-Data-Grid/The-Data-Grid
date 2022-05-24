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
import * as stamen from '../../client-scripts/stamen.js';
import glify from 'leaflet.glify';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard'


@Component({
 selector: 'app-filter-new',
 templateUrl: './filter.component.html',
 styleUrls: ['./filter.component.css', '../../tailwind.css']
})

export class NewFilterComponent implements OnInit, AfterViewInit {

 constructor(private apiService: ApiService,
   public datepipe: DatePipe,
   private toastr: ToastrService,
   private clipboard: Clipboard,
   private setupObjectService: SetupObjectService,
   private tableObjectService: TableObjectService) { }

@ViewChild('paginator') paginator: MatPaginator;

ngOnInit() {
	console.log(glify)
	// Layout Init
	// ==========================================

	// Set view type depending on if /map or /table
	let path = window.location.href.split('/')[window.location.href.split('/').length - 1];
	if(path == 'map') {
		this.viewType = 2;
	} else {
		this.viewType = 1;
	}
	console.log(this.viewType)

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
	
	this.getSetupObjectsAndFormatBuilder(this.viewType);
	this.expandFilter(this.viewType, true);

	if(this.viewType == 1) {
	} 
	else {
		this.mountMap();
	}

}

ngAfterViewInit(): void {
	
}


// =================================================
// GLOBAL STATE
// =================================================

// VIEW TYPE //
// 1 = Table, 2 = Map
viewType;
viewTypeStringLookup = {
	1: 'tableView',
	2: 'mapView'
};

changeViewType(e) {
	// format new view type
	let newViewType = e.index + 1;
	this.viewType = newViewType;
	const viewTypeString = this.viewTypeStringLookup[this.viewType];

	// format columnObjects
	this.getFilterableColumnIDs(this.queryState[viewTypeString], 2);
	this.setSelectedValues(this.queryState[viewTypeString], this.viewType == 1);
	// Init builder
	this.getQueryBuilder(this.viewType)

	// Table View
	if(newViewType == 1) {
		this.expandFilter(1, true)
		this.expandFilter(2, false)

		// /map to /table
		this.changeURL(false);
	}

	// Map view
	else {
		this.expandFilter(1, false)
		this.expandFilter(2, true)

		// /table to /map
		this.changeURL(true);

		if(!this.hasMapMounted) {
			this.mountMap();
		}
	}
}

// QUERY STATE

// Will come from API
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
queryState = {
	tableView: {
		selectedDatabase: 0,

		// queryTypes = ['Observations', 'Items'] // Don't need to store this, it's implied
		queryType: 'Observations',
		
		selectedFeature: 2, //Sink
		featuresOrItems: [],
		
		selectedFields: [],

		selectedSortField: null,
		filterBy: 'Ascending',
		currentPageSize: 10,
		currentPageIndex: 0,
		
		progressBarMode: 'determinate',
		progressBarValue: 100,

		// internal data
		currentFilterableColumnObjects: [],
		currentFilterableReturnableIDs: [],
		currentColumnObjects: [],
		currentReturnableIDs: [],
		currentColumnObjectIndices: [],

		// Query in-progress state
		queryTime: null,
		queryStart: null,
		queryTimer(start) {
			if(start) {
				this.queryStart = Date.now();
			} else {
				this.queryTime = Date.now() - this.queryStart
			}
		},
		invalidQuery: false,
		queryError: null,
		
		data: {
			tableData: [],
			headerNames: [],
			rowCount: null,
			isCached: null,
		}
	},
	mapView: {
		selectedDatabase: 0,

		queryType: 'Observations',

		selectedFeature: 2, //Sink
		featuresOrItems: [],

		selectedFields: [],
		previousSelectedFields: [],

		// internal data
		currentFilterableColumnObjects: [],
		currentFilterableReturnableIDs: [],
		currentColumnObjects: [],
		currentReturnableIDs: [],
		currentColumnObjectIndices: [],

		// Query in-progress state
		queryTime: null,
		queryStart: null,
		queryTimer(start) {
			if(start) {
				this.queryStart = Date.now();
			} else {
				this.queryTime = Date.now() - this.queryStart
			}
		},
		invalidQuery: false,
		queryError: null,

		// Array because there is an object *for each* field
		layers: []
	}
};
// Value change hooks
onQueryTypeChange(viewType: number)  {
	const viewTypeString = this.viewTypeStringLookup[viewType]
	this.queryState[viewTypeString].featuresOrItems = this.queryState[viewTypeString].queryType == 'Observations' ? this.allFeatures : this.allItems;
	this.queryState[viewTypeString].selectedFeature = this.queryState[viewTypeString].queryType == 'Observations' ? 2 : 15;
	this.onFeatureSelectChange(viewType);	
}
onFieldSelection(viewType: number) {
	const viewTypeString = this.viewTypeStringLookup[viewType];
	// when map view
	if(viewType == 2) {
		// add
		if(this.queryState.mapView.selectedFields.length > this.queryState.mapView.previousSelectedFields.length) {
			// get new ID
			// The values in the array are indices, so this is getting the value itself, not the index of the value in selectedFields
			let addedColumnIndex: any = this.queryState.mapView.selectedFields.filter(id => !this.queryState.mapView.previousSelectedFields.includes(id));
			addedColumnIndex = addedColumnIndex[0];
			// get columnObject
			let columnObject = this.queryState.mapView.currentColumnObjects[addedColumnIndex];
			this.queryState.mapView.layers.push({
				// Layer UI
				columnIndex: addedColumnIndex,				
				isVisible: true,
				isExpanded: false,
				type: columnObject.selectorType,
				typeName: columnObject.selectorType.replace('geo', ''),
				color: randomHex(),
				name: columnObject.frontendName,
				queryBuilderTarget: 'map-builder-global' + addedColumnIndex,

				geospatialReturnableID: this.queryState.mapView.currentReturnableIDs[addedColumnIndex],
				layerID: Math.ceil(Math.random()*100000),

				// The queryState of the map view at the time that the layer was selected. These same props that are directly  
				// in queryState.mapView are the state of the Data Selector dropdowns, these are the state of the dropdowns
				// *when this layer was selected*. The state must be saved so a query can be made for every layer. 
				// =========================================================================================================
				selectedDatabase: this.queryState.mapView.selectedDatabase,
				queryType: this.queryState.mapView.queryType,
				selectedFeature: this.queryState.mapView.selectedFeature, //Sink
				featuresOrItems: Array.from(this.queryState.mapView.featuresOrItems),
				
				selectedFields: [], // must set to all fields for the feature with setSelectedValues()

				selectedSortField: null, // const
				filterBy: 'Ascending', // const

				currentPageSize: 10000, // const
				currentPageIndex: 0, // const 
				
				progressBarMode: 'determinate',
				progressBarValue: 100,
		
				// internal data
				currentFilterableColumnObjects: Array.from(this.queryState.mapView.currentFilterableColumnObjects),
				currentFilterableReturnableIDs: Array.from(this.queryState.mapView.currentFilterableReturnableIDs),
				currentColumnObjects: Array.from(this.queryState.mapView.currentColumnObjects),
				currentReturnableIDs: Array.from(this.queryState.mapView.currentReturnableIDs),
				currentColumnObjectIndices: Array.from(this.queryState.mapView.currentColumnObjectIndices),
		
				// Query in-progress state
				queryTime: null,
				queryStart: null,
				queryTimer(start) {
					if(start) {
						this.queryStart = Date.now();
					} else {
						this.queryTime = Date.now() - this.queryStart
					}
				},
				invalidQuery: false,
				queryError: null,
				// =========================================================================================================

				// Map Data
				data: {
					tableData: [],
					headerNames: [],
					rowCount: null,
					isCached: null,
				}
			});
			// add all values for the feature
			this.setSelectedValues(this.queryState.mapView.layers[this.queryState.mapView.layers.length - 1], true);
			// init the query builder
			this.getQueryBuilder(2, addedColumnIndex);
			console.log(this.queryState.mapView.layers[this.queryState.mapView.layers.length - 1].selectedFields)
		}
		// remove
		else {
			// The values in the array are indices, so this is getting the value itself, not the index of the value in selectedFields
			let removedColumnIndex: any = this.queryState.mapView.previousSelectedFields.filter(id => !this.queryState.mapView.selectedFields.includes(id));
			for(let n = 0; n < this.queryState.mapView.layers.length; n++) {
				let layer = this.queryState.mapView.layers[n];
				// check if this layer is the removed layer
				if(layer.columnIndex == removedColumnIndex) {
					// remove the layer
					this.queryState.mapView.layers.splice(n, 1);
					break;
				}
			}
		}
		// update the previous state to match current
		this.queryState.mapView.previousSelectedFields = Array.from(this.queryState.mapView.selectedFields);
	}

	// random color util
	function randomHex() {
		return '#' + Math.floor(Math.random()*16777215).toString(16);
	}
}
onFeatureSelectChange (viewType: number) {
	const viewTypeString = this.viewTypeStringLookup[viewType]
	this.getFilterableColumnIDs(this.queryState[viewTypeString], this.queryState.tableView.selectedFeature);
}
onPageChange(event: PageEvent, viewType: number): PageEvent {
	const viewTypeString = this.viewTypeStringLookup[viewType];
	// update page data
	this[viewTypeString].currentPageSize = event.pageSize;
	this[viewTypeString].currentPageIndex = event.pageIndex;
	// refresh API
	this.runQuery(this[viewTypeString], this[viewTypeString].data, {isPaginationQuery: true, target: 'table-builder'});
	return event;
}
onDatabaseChange(viewType) {
	const viewTypeString = this.viewTypeStringLookup[viewType];
	// do something
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

builderLookup = {
	1: 'table-builder',
	2: 'map-builder-global'
}

expandedPanelLookup = {
	'table-builder': false,
	'map-builder-global': false,
	'map-builder-layers': false
}

async expandFilter(viewType: number, set: boolean) {
	if(set) {
		await new Promise(r => setTimeout(r, 100));
	}
	if(viewType == 1) {
		this.expandedPanelLookup['table-builder'] = set;
	} else {
		this.expandedPanelLookup['map-builder-global'] = set;
	}
}

getQueryBuilder(viewType: number, columnIndex='') {
	// get viewTypeString to access queryState
	let viewTypeString = this.viewTypeStringLookup[viewType];
	// appends the columnIndex if the builder is for a specific layer
	const builderName = this.builderLookup[viewType] + columnIndex;

	// builder configuration
	let builderID = '#' + builderName;
	let queryBuilderConfig: any = {
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
	}
	if(builderName == 'map-builder-global') {
		//queryBuilderConfig.default_filter = 1;
	}

	// fill the filters
	let filters;
	// global special case with one 'all' filter
	console.log(this.validOperatorLookup['geoPoint'].map(op => this.TDGOperatorToBuilderOperatorLookup[op]));
	if(builderName == 'map-builder-global') {
		filters = [{
			id: 1,
			label: 'All Layers',
			operators: this.validOperatorLookup['geoPoint'].map(op => this.TDGOperatorToBuilderOperatorLookup[op]),
			type: 'string',
			input: this.TDGSelectorTypeToBuilderInputLookup['geoPoint'],
		}];
		filters[0].default_operator = 'intersects';
	}
	// other cases
	else {
		filters = this.queryState[viewTypeString].currentFilterableReturnableIDs.map((id, index) => {
			let columnObject = this.queryState[viewTypeString].currentFilterableColumnObjects[index];
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
	}

	queryBuilderConfig.filters = filters;
	
	// init
	$(document).ready(() => {
		(<any>$(builderID)).queryBuilder(queryBuilderConfig);
	});

	// This is really bad. I am waiting an arbitrary 300ms to update the rules because
	// filters.set_default is throwing an error and there isn't a build int way to listen
	// for when the query builder is ready to accept the .setRules() method. This should
	// be fine for now except maybe on exceptionally slow machines which load the builder
	// in longer than 300ms?
	/*
	setTimeout(() => (<any>$(builderID)).queryBuilder('setRules', {
		"condition": "AND",
		"rules": [
		  {
			"id": 1,
			"field": 1,
			"type": "string",
			"input": "text",
			"operator": "intersects"
		  }
		],
		"valid": true
	  }), 300);
	  */
}
/*
refreshQueryBuilder() {
	(<any>$('#builder')).queryBuilder('reset');
	(<any>$('#builder')).queryBuilder('setOptions', {
		plugins: [],
		filters: this.filters,
		select_placeholder: '-',
		rules: [{
			
			empty: true
		}],
		allow_empty: true
	})
}
*/
getRulesQueryBuilder(target) {
	const rules = (<any>$('#' + target)).queryBuilder('getRules', { skip_empty: true });
	return rules;
}

formatQueryString(rules) {
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

// Global Objects from setup
setupObject;
setupFilterObject;
allFeatures;
allItems;

getSetupObjectsAndFormatBuilder(viewType: number) {
	let viewTypeString = this.viewTypeStringLookup[viewType];
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
			this.getFilterableColumnIDs(this.queryState[viewTypeString], 2);
			// set the selected fields (all for table, none for map)
			this.setSelectedValues(this.queryState[viewTypeString], viewType == 1); // set all as selected for table view
			// init the query builder given the column objects
			this.getQueryBuilder(viewType); // using viewType (int) instead of viewTypeString (string)
			
			// if table view then auto run a query
			if(viewType == 1) {
				this.runQuery(this.queryState[viewTypeString], this.queryState[viewTypeString].data,{isPaginationQuery: false, target: 'table-builder', viewType: 1});
			}
		});
	})
  }
  
parseSetupObject() {
	// get root features
	this.allFeatures = this.setupObject.features;
	this.allItems = this.setupObject.items;
}

/**
 * Fills the internal objects with the correct columnObjects for a specific feature
 * @param featureID 
 */
getFilterableColumnIDs(queryStateObject: any, featureID: number): any {
	queryStateObject.featuresOrItems = queryStateObject.queryType == 'Observations' ? this.allFeatures : this.allItems;

	if(queryStateObject.queryType == 'Observations') {
		queryStateObject.currentColumnObjectIndices = this.setupFilterObject.observationColumnObjectIndices[featureID];
		queryStateObject.currentReturnableIDs = this.setupFilterObject.observationReturnableIDs[featureID];
	} else {
		queryStateObject.currentColumnObjectIndices = this.setupFilterObject.itemColumnObjectIndices[featureID];
		queryStateObject.currentReturnableIDs = this.setupFilterObject.itemReturnableIDs[featureID];
	}

	queryStateObject.currentFilterableColumnObjects = queryStateObject.currentColumnObjectIndices
			.map(index => this.setupObject.columns[index])
			.filter(col => col.isFilterable);

	queryStateObject.currentFilterableReturnableIDs = queryStateObject.currentColumnObjectIndices
			.map((columnObjectIndex, arrayIndex) => [this.setupObject.columns[columnObjectIndex], arrayIndex])
			.filter(arr => arr[0].isFilterable)
			.map(arr => queryStateObject.currentReturnableIDs[arr[1]]);

	queryStateObject.currentColumnObjects = queryStateObject.currentColumnObjectIndices
		.map(index => this.setupObject.columns[index]);
}

setSelectedValues(queryStateObject: any, setAllAsSelected: boolean) {
	queryStateObject.selectedSortField = null;
	// set all as selected?
	if(setAllAsSelected) {
		queryStateObject.selectedFields = queryStateObject.currentColumnObjects.map((col, i) => i)
	}
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

// Master database query function, calls runQuery n times with necessary params depending on queryState
queryDatabase() {
	// Table View: call once for the selected fields
	if(this.viewType == 1) {
		this.runQuery(this.queryState.tableView, this.queryState.tableView.data, {isPaginationQuery: true, target: 'table-builder', globalFilterRules: null, viewType: 1});
	}
	// Map View: call for every layer with all fields from that layer's feature
	else {
		// reset error state
		this.queryState.mapView.invalidQuery = false;
		this.queryState.mapView.queryError = null;
		// check for layers
		if(this.queryState.mapView.layers.length == 0) {
			this.queryState.mapView.invalidQuery = true;
			this.queryState.mapView.queryError = 'noLayers';
			return;
		}
		// combine global rules with 
		let globalRules: any = this.getRulesQueryBuilder('map-builder-global')
		console.log(globalRules)
		// if invalid
		if(globalRules === null) {
			this.queryState.mapView.invalidQuery = true;
			this.queryState.mapView.queryError = 'queryBuilder';
			return;
		}
		// if empty rule set then don't pass it
		if(globalRules.rules.length == 0) {
			globalRules = null;
		}
		for(let layer of this.queryState.mapView.layers) {
			this.runQuery(layer, layer.data, {isPaginationQuery: true, target: layer.queryBuilderTarget, globalFilterRules: globalRules, viewType: 2});
		}
	}
}

private runQuery(queryStateObject: any, queryDataObject: any, options: any) {
	const {
		isPaginationQuery,
		target,
		globalFilterRules,
		viewType,
	} = options;
	queryStateObject.invalidQuery = false;
	queryStateObject.queryError = null;
	let queryString = '';
	if(!this.isFirstQuery) {
		let rules = this.getRulesQueryBuilder(target);
		if(rules === null) {
			queryStateObject.invalidQuery = true;
			queryStateObject.queryError = 'queryBuilder';
			return;
		}
		// combine rules if global rules exist
		if(globalFilterRules !== null) {
			rules = {
				condition: 'AND',
				valid: true,
				rules: [...globalFilterRules, ...rules]
			};
		}
		queryString = this.formatQueryString(rules);
	} 
	queryStateObject.progressBarMode = 'indeterminate';
	const isObservation = queryStateObject.queryType === 'Observations';
	const selectedFeature = queryStateObject.selectedFeature;
	const feature = isObservation ? 
		this.allFeatures[selectedFeature].backendName :
		this.allItems[selectedFeature].backendName;
	const columnObjectIndices = queryStateObject.currentColumnObjectIndices;
	const columnObjectIndicesIndices = [...new Set([...queryStateObject.selectedFields, ...(queryStateObject.selectedSortField ? [queryStateObject.selectedSortField] : [])])];
	const returnableIDs = this.getReturnablesFromColumnIDs(columnObjectIndicesIndices, isObservation, selectedFeature);
	const sortObject = queryStateObject.selectedSortField ? {
		isAscending: queryStateObject.filterBy === 'Ascending',
		returnableID: this.getReturnablesFromColumnIDs([queryStateObject.selectedSortField], isObservation, selectedFeature)[0]
	} : null;
	const pageObject = {
		limit: queryStateObject.currentPageSize,
		offset: queryStateObject.currentPageIndex * queryStateObject.currentPageSize
	};
	// 

	const responseHandlerOptions: any = {
		isObservation,
		selectedFeature,
		isPaginationQuery,
	};
	
	let dataResponseHandler;
	let errorResponseHandler;
	// table handlers
	if(viewType == 1) {
		dataResponseHandler = this.tableViewDataResponseHandler(queryStateObject, queryDataObject, responseHandlerOptions);
		errorResponseHandler = this.tableViewErrorResponseHandler(queryStateObject);
	}
	// map handlers
	else {
		responseHandlerOptions.geospatialReturnableID = queryStateObject.geospatialReturnableID;
		responseHandlerOptions.layerID = queryStateObject.layerID;
		responseHandlerOptions.geoType = queryStateObject.type;

		dataResponseHandler = this.mapViewDataResponseHandler(queryStateObject, queryDataObject, responseHandlerOptions);
		errorResponseHandler = this.mapViewErrorResponseHandler(queryStateObject);
	}
	console.log(dataResponseHandler);

	queryStateObject.queryTimer(true);
	// Handle data or error response with applicable handler
	this.apiService.newGetTableObject(isObservation, feature, returnableIDs, queryString, sortObject, pageObject)
		.subscribe(
			// Ignoring typescript here, observables aren't liking my beautiful closure :(
			// @ts-ignore: No overload matches this call
			dataResponseHandler,
			errorResponseHandler
		)
}

private tableViewDataResponseHandler(queryStateObject, queryDataObject, handlerOptions): Function {
	const {
		isObservation,
		selectedFeature,
		isPaginationQuery,
	} = handlerOptions;
	return (res) => {
		// Set data
		let relevantSetupFilterObjectReturnableIDs = isObservation ? this.setupFilterObject.observationReturnableIDs[selectedFeature] : this.setupFilterObject.itemReturnableIDs[selectedFeature];
		let relevantSetupFilterObjectColumnObjectIndices = isObservation ? this.setupFilterObject.observationColumnObjectIndices[selectedFeature] : this.setupFilterObject.itemColumnObjectIndices[selectedFeature];
		queryDataObject.headerNames = ['ID', ...res.returnableIDs.map(id => this.setupObject.columns[relevantSetupFilterObjectColumnObjectIndices[relevantSetupFilterObjectReturnableIDs.indexOf(id)]].frontendName)];
		queryDataObject.tableData = res.rowData.map((row, i) => [res.primaryKey[i], ...row]);
		queryDataObject.isCached = res.cached === true;
		queryDataObject.rowCount = res.nRows.n;

		if(!isPaginationQuery) {
			this.paginator.firstPage();
		}

		queryStateObject.progressBarMode = 'determinate';
		this.isFirstQuery = false;
		queryStateObject.queryTimer(false);
	};
}

private tableViewErrorResponseHandler(queryStateObject): Function {
	return (err) => {
		queryStateObject.progressBarMode = 'determinate'
			this.isFirstQuery = false;
			queryStateObject.queryTimer(false);
			queryStateObject.queryError = err.error;
	};
}

private mapViewDataResponseHandler(queryStateObject, queryDataObject, handlerOptions): Function {
	const {
		isObservation,
		selectedFeature,
		geospatialReturnableID,
		layerID,
		geoType,
	} = handlerOptions;
	return (res) => {
		// Set data
		let relevantSetupFilterObjectReturnableIDs = isObservation ? this.setupFilterObject.observationReturnableIDs[selectedFeature] : this.setupFilterObject.itemReturnableIDs[selectedFeature];
		let relevantSetupFilterObjectColumnObjectIndices = isObservation ? this.setupFilterObject.observationColumnObjectIndices[selectedFeature] : this.setupFilterObject.itemColumnObjectIndices[selectedFeature];
		queryDataObject.headerNames = ['ID', ...res.returnableIDs.map(id => this.setupObject.columns[relevantSetupFilterObjectColumnObjectIndices[relevantSetupFilterObjectReturnableIDs.indexOf(id)]].frontendName)];
		queryDataObject.tableData = res.rowData.map((row, i) => [res.primaryKey[i], ...row]);
		queryDataObject.isCached = res.cached === true;
		queryDataObject.rowCount = res.nRows.n;

		// parse the geojson row and hand it to the rendering engine
		const geospatialReturnableIDIndex = res.returnableIDs.indexOf(geospatialReturnableID);
		let geojsonArray = JSON.parse(res.rowData.map(row => row[geospatialReturnableIDIndex]));
		console.log(geojsonArray);
		// combine geojson and add the _index
		// ...

		//this.renderGeography(geojson, geoType, layerID);
	};
}

private mapViewErrorResponseHandler(queryStateObject): Function {
	return (err) => {

	};
}

// Download
// Master database query function, calls runQuery n times with necessary params depending on queryState
downloadDatabase() {
	// Table View: call once for the selected fields
	if(this.viewType == 1) {
		this.runDownload(this.queryState.tableView);
	}
	// Map View: call for every layer with all fields from that layer's feature
	else {

	}
}

runDownload(queryStateObject) {
	this.isDownloading = true;
	const isObservation = queryStateObject.queryType === 'Observations';
	const feature = isObservation ? 
		this.allFeatures[queryStateObject.selectedFeature].backendName :
		this.allItems[queryStateObject.selectedFeature].backendName;
	const columnObjectIndices = queryStateObject.currentColumnObjectIndices;
	const columnObjectIndicesIndices = [...new Set([...queryStateObject.selectedFields, ...(queryStateObject.selectedSortField ? [queryStateObject.selectedSortField] : [])])]
	const returnableIDs = this.getReturnablesFromColumnIDs(columnObjectIndicesIndices, isObservation, queryStateObject.selectedFeature);
	const sortObject = queryStateObject.selectedSortField ? {
		isAscending: queryStateObject.filterBy === 'Ascending',
		returnableID: this.getReturnablesFromColumnIDs([queryStateObject.selectedSortField], isObservation, queryStateObject.selectedFeature)[0]
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

isMapSettingsExpanded = false;
private hasMapMounted = false;
selectedBasemapKey = 'stamenTerrain';
oldBasemapKey = 'stamenTerrain';
// Set basemap layers
basemapLayers = {
	openStreetMap: {
		name: 'Open Street Map',
		data: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 18,
			minZoom: 3,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		})
	},
	esriImagery: {
		name: 'Esri Imagery',
		data: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	})},
	stamenWatercolor: {
		name: 'Stamen Watercolor',
		data: L.tileLayer(this.stamenURLFormatter(stamen.stamen.tile.providers.watercolor.url), stamen.stamen.tile.providers.watercolor)
	},
	stamenTerrain: {
		name: 'Stamen Terrain',
		data: L.tileLayer(this.stamenURLFormatter(stamen.stamen.tile.providers.terrain.url), stamen.stamen.tile.providers.terrain)
	},
	stamenToner: {
		name: 'Stamen Toner',
		data: L.tileLayer(this.stamenURLFormatter(stamen.stamen.tile.providers.toner.url), stamen.stamen.tile.providers.toner)
	}
}
basemapLayersArray = Object.keys(this.basemapLayers);

private stamenURLFormatter(url) {
	url = url.replace('{S}', '{s}');
	url = url.replace('{X}', '{x}');
	url = url.replace('{Y}', '{y}');
	url = url.replace('{Z}', '{z}');
	return url;
}

private map;

onBasemapChange() {
	this.map.addLayer(this.basemapLayers[this.selectedBasemapKey].data);
	this.map.removeLayer(this.basemapLayers[this.oldBasemapKey].data);
	this.oldBasemapKey = this.selectedBasemapKey;
}

private initMap(): void {
	this.map = L.map('map', {
		center: [ 34.06551008335871, -118.4418661368747 ],
		zoom: 15,
		zoomControl: false
	});

	L.control.zoom({
		position: 'bottomright'
	}).addTo(this.map);

	L.control.scale().addTo(this.map)

	// default
	this.map.addLayer(this.basemapLayers[this.selectedBasemapKey].data);
}

// Must invalidate the size because a bug where the tiles do not render properly on first load
private invalidate() {
	setTimeout(() => {
		this.map.invalidateSize(true);
	 }, 1);
}

// Layer handling
layerDropped(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.queryState.mapView.layers, event.previousIndex, event.currentIndex);
}
 
private mountMap() {
	this.initMap();
	this.invalidate();
	this.hasMapMounted = true;
}

private renderGeography(geojson, geoType, layerID) {
	/*
	Example 100,000 points
	let pointsx = Array(100_000).fill(0).map(n => n + Math.random());
	let pointsy = Array(100_000).fill(0).map(n => n + Math.random());
	let points = pointsx.map((n, i) => [34.06 + n, -118.44 + pointsy[i]])
	*/
	// get layer
	const relevantLayer = this.queryState.mapView.layers.filter(layer => layer.layerID == layerID)[0];

	let visualOptions: any = {
		color: relevantLayer.color
	}
	if(geoType == 'geoPoint') {
		visualOptions.size = 20;
		visualOptions.sensitivity = 1;
	} else if(geoType == 'geoLine') {
		visualOptions.sensitivity = 0.06;
		visualOptions.weight = 6;
	} else if(geoType == 'geoRegion') {
		visualOptions.sensitivity = 0.06;
		visualOptions.border = true;
	}

	glify.latitudeFirst();
	let gl = glify.points({
		...{visualOptions},
		map: this.map,
		data: geojson,
		//sensitivity: 0.01,
		click: (e, feature) => {
			// Get the value from its row
			const {
				_index
			} = feature.properties;
			
			const valueArray = relevantLayer.data.tableData[_index];
			const headerArray = relevantLayer.data.headerNames;
			// Create an HTML template for every header and value in the row and geography
			let popupHTML = '<div class="flex flex-col mt-2" style="width: 300px">';
			// geographic value
			popupHTML += `
				<div style="font-size: 14px; font-weight: 300; color: #a0a0a0">
					Geometry
				</div>
			`;
			popupHTML += formatPopupTemplate('Type', geoType.slice(3));
			popupHTML += `
				<button class="standard-button border p-2 my-1" (click)="copyToClipboard(JSON.stringify(feature))" mat-button>
					<span class="standard-button-text">
						Copy GeoJSON
					</span>
				</button>
			`;
			// row values
			for(let i = 0; i < headerArray.length; i++) {
				// add title
				if(i == 0) {
					popupHTML += `
						<div style="font-size: 14px; font-weight: 300; color: #a0a0a0">
							Properties
						</div>
					`;
				}
				popupHTML += formatPopupTemplate(headerArray[i], valueArray[i]);
			}
			// close div
			popupHTML += '</div>'

			// Create a unique datetime, so the popup class can be referenced uniquely
			let now = Date.now();
			L.popup({
				className: 'map-popup-' + now,
			})
			.setLatLng(e.latlng)
			.setContent(popupHTML)
			.openOn(this.map);

			// Prevent the href="#close" to be fired on the popup becaues this causes a router redirection in Angular
			// Must reference the unique time so the event listener is added to the right popup
			document.querySelector(`.map-popup-${now} .leaflet-popup-close-button`).addEventListener('click', event => {
				event.preventDefault();
			});

			function formatPopupTemplate(key, value) {
				return `
					<div class="flex flex-row justify-between border-t px-3 py-1">
						<span style="font-size: 14px; font-weight: 600">${key}</span>
						<span style="font-size: 14px; font-weight: 400">${value}</span>
					</div>
				`;
			}
		}
	});

	// add to the layer
	relevantLayer.renderObject = gl;
}

copyToClipboard(data: string) {
	this.clipboard.copy(data);
	this.toastr.success('Copied to clipboard')
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

// 0 = top, 1 = bottom
currentlySnappedTo = 0;
snapTo(curr) {
	window.scrollTo({top: curr == 0 ? document.body.scrollHeight : 0, behavior: 'smooth'});
	this.currentlySnappedTo = curr == 0 ? 1 : 0;
	if(curr == 1) {
		this.isMapSettingsExpanded = false;
	}
}

// Change URL between /map and /table
private changeURL(isMap) {
	let path = window.location.href.split('/')[window.location.href.split('/').length - 1];
	if(isMap) {
		path = path.replace('table', 'map');
	} else {
		path = path.replace('map', 'table');
	}
	window.history.replaceState({}, '', '/' + path)
}

updateColor(e, columnIndex) {
	let layerToUpdate = this.queryState.mapView.layers.filter(layer => layer.columnIndex == columnIndex)[0];
	layerToUpdate.color = e.target.value;
}

expandAllLayers(expand) {
	this.queryState.mapView.layers.forEach(layer => layer.isExpanded = expand)
}

}