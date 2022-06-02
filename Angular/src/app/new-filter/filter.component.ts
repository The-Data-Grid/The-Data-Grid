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
import { Clipboard } from '@angular/cdk/clipboard';
import leafleatImage from 'leaflet-image';
import leafletDraw from 'leaflet-draw';

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
		this.mapViewType = 1
	} else {
		this.viewType = 1;
	}
	console.log(this.viewType)

	console.log(leafletDraw);

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
	this.expandFilter(this.viewType == 1 ? 'table-builder' : 'map-builder-global', true);

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
// 1 = Vertical, 2 = Horizontal
mapViewType;

changeViewType(e) {
	// format new view type
	let newViewType = e.index + 1;
	this.viewType = newViewType;
	const viewTypeString = this.viewTypeStringLookup[this.viewType];

	// reset queryState
	this.resetQueryState();

	// format columnObjects
	this.getFilterableColumnIDs(this.queryState[viewTypeString], 2);
	this.setSelectedValues(this.queryState[viewTypeString], this.viewType == 1);
	// Init builder
	this.getQueryBuilder(this.viewType)

	// Table View
	if(newViewType == 1) {
		this.expandFilter('table-builder', true)
		this.expandFilter('map-builder-global', false)

		// /map to /table
		this.changeURL(false);

		// Fill table
		this.runQuery(this.queryState.tableView, this.queryState.tableView.data,{isPaginationQuery: false, target: 'table-builder', viewType: 1});
	}

	// Map view
	else {
		this.expandFilter('table-builder', false)
		this.expandFilter('map-builder-global', true)

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
queryState: any = {
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
		currentGeospatialFieldObjects: [],

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
		hasQueried: false,
		
		data: {
			tableData: [],
			headerNames: [],
			rowCount: null,
			isCached: null,
			primaryKeys: [],
		}
	},
	mapView: {
		selectedDatabase: 0,

		queryType: 'Observations',

		selectedFeature: 2, //Sink
		featuresOrItems: [],

		selectedFields: [],

		// internal data
		currentFilterableColumnObjects: [],
		currentFilterableReturnableIDs: [],
		currentColumnObjects: [],
		currentReturnableIDs: [],
		currentColumnObjectIndices: [],
		currentGeospatialFieldObjects: [],

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
onFieldSelection(viewType: number, event?: any) {
	// when map view
	if(viewType == 2) {
		// get new ID
		let addedColumnIndex = event.value;
		event.source.value = null;

		// get columnObject
		let columnObject = this.queryState.mapView.currentColumnObjects[addedColumnIndex];
		this.toastr.success('Added new layer: ' + columnObject.frontendName, null, {positionClass: 'toast-top-left'});
		this.queryState.mapView.layers.push({
			// Layer UI
			columnIndex: addedColumnIndex,				
			isVisible: true,
			isExpanded: false,
			type: columnObject.selectorType,
			typeName: columnObject.selectorType.replace('geo', ''),
			color: randomHex(),
			colorByProperty: false,
			size: 10,
			opacity: 0.8,
			// 1 = Circle, 2 = Square
			pointType: 1,
			name: columnObject.frontendName,

			geospatialReturnableID: this.queryState.mapView.currentReturnableIDs[addedColumnIndex],
			geospatialReturnableIDIndex: null,
			layerID: Math.ceil(Math.random()*10000000),
			renderObject: null,
			isRendering: false,

			// The queryState of the map view at the time that the layer was selected. These same props that are directly  
				// The queryState of the map view at the time that the layer was selected. These same props that are directly  
			// The queryState of the map view at the time that the layer was selected. These same props that are directly  
			// in queryState.mapView are the state of the Data Selector dropdowns, these are the state of the dropdowns
			// *when this layer was selected*. The state must be saved so a query can be made for every layer. 
				// *when this layer was selected*. The state must be saved so a query can be made for every layer. 
			// *when this layer was selected*. The state must be saved so a query can be made for every layer. 
			// =========================================================================================================
			selectedDatabase: this.queryState.mapView.selectedDatabase,
			queryType: this.queryState.mapView.queryType,
			selectedFeature: this.queryState.mapView.selectedFeature, //Sink
			featuresOrItems: Array.from(this.queryState.mapView.featuresOrItems),
			
			selectedFields: [], // must set to all fields for the feature with setSelectedValues()

			selectedSortField: null, // const
			filterBy: 'Ascending', // const

			currentPageSize: 1000000, // const
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
			isQuerying: false,
			queryTimer(start) {
				if(start) {
					this.isQuerying = true;
					this.queryStart = Date.now();
				} else {
					this.isQuerying = false;
					this.queryTime = Date.now() - this.queryStart
				}
			},
			invalidQuery: false,
			queryError: null,
			hasQueried: false,
			// =========================================================================================================

			// Map Data
			data: {
				tableData: [],
				headerNames: [],
				rowCount: null,
				isCached: null,
				primaryKeys: [],
			}
		});
		const relevantLayer = this.queryState.mapView.layers[this.queryState.mapView.layers.length - 1];
		// add all values for the feature
		this.setSelectedValues(relevantLayer, true);
		// set the builder target
		relevantLayer.queryBuilderTarget = 'map-builder-global' + relevantLayer.layerID;
		// init the query builder
		this.getQueryBuilder(2, relevantLayer.layerID);
		// open the dropdown and close the global dropdown
		this.expandFilter('map-builder-layers', true);
		this.expandFilter('map-builder-global', false);
		relevantLayer.isExpanded = true;
	}

	// random color util
	function randomHex() {
		return '#' + Math.floor(Math.random()*16777215).toString(16);
	}
}
onFeatureSelectChange (viewType: number) {
	const viewTypeString = this.viewTypeStringLookup[viewType]
	this.getFilterableColumnIDs(this.queryState[viewTypeString], this.queryState[viewTypeString].selectedFeature);
}
onPageChange(event: PageEvent, viewType: number): PageEvent {
	const viewTypeString = this.viewTypeStringLookup[viewType];
	// update page data
	this.queryState[viewTypeString].currentPageSize = event.pageSize;
	this.queryState[viewTypeString].currentPageIndex = event.pageIndex;
	// refresh API
	this.runQuery(this.queryState[viewTypeString], this.queryState[viewTypeString].data, {isPaginationQuery: true, target: 'table-builder'});
	return event;
}
onDatabaseChange(viewType) {
	const viewTypeString = this.viewTypeStringLookup[viewType];
	// do something
}


// =================================================
// QUERY BUILDER
// =================================================

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

async expandFilter(builderName: string, set: boolean) {
	if(set) {
		await new Promise(r => setTimeout(r, 100));
	}
	this.expandedPanelLookup[builderName] = set;
}

getQueryBuilder(viewType: number, layerID='') {
	// get viewTypeString to access queryState
	let viewTypeString = this.viewTypeStringLookup[viewType];
	// appends the columnIndex if the builder is for a specific layer
	const builderName = this.builderLookup[viewType] + layerID;

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

	console.log(filters)
	
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

	queryStateObject.currentGeospatialFieldObjects = queryStateObject.currentColumnObjectIndices
			.map((columnObjectIndex, arrayIndex) => [this.setupObject.columns[columnObjectIndex], arrayIndex])
			.filter(arr => ['geoPoint', 'geoLine', 'geoRegion'].includes(arr[0].selectorType))
			.map(arr => ({returnableID: queryStateObject.currentReturnableIDs[arr[1]], columnObject: arr[0], arrayIndex: arr[1]}));

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
	let {
		isPaginationQuery,
		target,
		globalFilterRules,
		viewType,
	} = options;
	queryStateObject.invalidQuery = false;
	queryStateObject.queryError = null;
	let queryString = '';
	if(queryStateObject.hasQueried || viewType == 2) {
		let rules = this.getRulesQueryBuilder(target);
		if(rules === null) {
			queryStateObject.invalidQuery = true;
			queryStateObject.queryError = 'queryBuilder';
			return;
		}
		// combine rules if global rules exist
		if(globalFilterRules !== null && globalFilterRules !== undefined) {
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
	if(viewType === undefined) viewType = this.viewType; // fall back on global viewType
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

	queryStateObject.hasQueried = true;
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
		queryDataObject.tableData = res.rowData;
		queryDataObject.isCached = res.cached === true;
		queryDataObject.rowCount = res.nRows.n;
		queryDataObject.primaryKeys = res.primaryKey;

		if(!isPaginationQuery) {
			this.paginator.firstPage();
		}

		queryStateObject.progressBarMode = 'determinate';
		queryStateObject.hasQueried = true;
		queryStateObject.queryTimer(false);
	};
}

private tableViewErrorResponseHandler(queryStateObject): Function {
	return (err) => {
		queryStateObject.progressBarMode = 'determinate'
			queryStateObject.hasQueried = true;
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
		queryDataObject.tableData = res.rowData;
		queryDataObject.isCached = res.cached === true;
		queryDataObject.rowCount = res.nRows.n;
		queryDataObject.primaryKeys = res.primaryKey;

		// parse the geojson row and hand it to the rendering engine
		const geospatialReturnableIDIndex = res.returnableIDs.indexOf(geospatialReturnableID);
		queryStateObject.geospatialReturnableIDIndex = geospatialReturnableIDIndex

		let featureCollection = this.rowDataToFeatureCollection(res.rowData, geospatialReturnableIDIndex)

		queryStateObject.queryTimer(false);
		this.renderGeography(featureCollection, geoType, layerID);
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
		data: L.tileLayer(this.stamenURLFormatter(stamen.stamen.tile.providers.watercolor.url), this.stamenOptionsFormatter(stamen.stamen.tile.providers.watercolor, 17))
	},
	stamenTerrain: {
		name: 'Stamen Terrain',
		data: L.tileLayer(this.stamenURLFormatter(stamen.stamen.tile.providers.terrain.url), this.stamenOptionsFormatter(stamen.stamen.tile.providers.terrain, 16))
	},
	stamenToner: {
		name: 'Stamen Toner',
		data: L.tileLayer(this.stamenURLFormatter(stamen.stamen.tile.providers.toner.url), this.stamenOptionsFormatter(stamen.stamen.tile.providers.toner, 17))
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

private stamenOptionsFormatter(obj, zoom) {
	obj.maxZoom = zoom;
	return obj;
}

private map;
drawnItems = new L.FeatureGroup();

onBasemapChange(key) {
	this.selectedBasemapKey = key;
	this.map.addLayer(this.basemapLayers[this.selectedBasemapKey].data);
	this.map.removeLayer(this.basemapLayers[this.oldBasemapKey].data);
	this.oldBasemapKey = this.selectedBasemapKey;
}

private initMap(): void {
	this.map = L.map('map', {
		center: [ 34.06551008335871, -118.4418661368747 ],
		zoom: 10,
		zoomControl: false
	});

	L.control.zoom({
		position: 'bottomright'
	}).addTo(this.map);

	L.control.scale().addTo(this.map)

	this.map.addLayer(this.drawnItems);

	let drawControl = new L.Control.Draw({
		draw : {
			circlemarker: false,
			circle: false,
			rectangle: <any>{ showArea: false },
			marker: {
				icon: L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: 'assets/marker-icon-2x.png',
                    shadowUrl: 'assets/marker-shadow.png'
                })
			},
			polygon: {
				allowIntersection: false, // Restricts shapes to simple polygons
				drawError: {
				  color: '#e1e100', // Color the shape will turn when intersects
				  message: '<strong>Polygon draw does not allow intersections!<strong>' // Message that will show when intersect
				}
			}
		},
		edit: {
			featureGroup: this.drawnItems
		},
		position: 'topright'
	});

	this.map.on('draw:created', createEvent => {
		const { layer } = createEvent;
		this.addDrawLayerPopup(layer);
		this.drawnItems.addLayer(layer);
	});

	this.map.on('draw:edited', editEvent => {
		const { layers } = editEvent;
		layers.eachLayer(layer => {
			this.addDrawLayerPopup(layer);
		})
	});
	  
	this.map.addControl(drawControl); 

	// default basemap
	this.map.addLayer(this.basemapLayers[this.selectedBasemapKey].data);
}

private addDrawLayerPopup(layer) {
	const layerGeoJSON = layer.toGeoJSON();
	layer.on('click', clickEvent => {
		// popup
		let copyButtonID = Date.now();
		L.popup({
			closeButton: false
		})
		.setLatLng(clickEvent.latlng)
		.setContent(`
			<div class="flex flex-col" style="width: 300px; max-height: 300px;">
				<button id="${copyButtonID}" class=" border p-3 inline border-[#569CD7] rounded hover:bg-[#a3c5e0] shadow" style="font-weight: 400;
				font-size: 1rem;
				line-height: 1.2;
				letter-spacing: 0.0065em;">
					<span class="standard-button-text text-[#569CD7]">
						Copy GeoJSON
					</span>
				</button>
			</div>
		`)
		.openOn(this.map);

		// copy geojson
		// add copygeojson click listener
		let copyButtonElement = document.getElementById(String(copyButtonID));
		copyButtonElement.addEventListener('click',() => {
			// switch coord order!
			layerGeoJSON.geometry.coordinates.reverse();
			this.clipboard.copy(JSON.stringify(layerGeoJSON));
			this.toastr.success('Copied to clipboard')
		});
	})
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

// WebGL .glsl shaders
shaderLookup = {
	1: "precision mediump float;varying vec4 _color;void main(){float radius = 0.5;vec2 center = vec2(0.5);vec4 color0 = vec4(0.0);vec2 m = gl_PointCoord.xy - center;float dist = radius - sqrt(m.x * m.x + m.y * m.y);gl_FragColor = color0;if (dist > 0.0) {gl_FragColor = _color;}}",
	2: "precision mediump float;varying vec4 _color;void main(){gl_FragColor = _color;}",
	3: "precision mediump float;varying vec4 _color;void main(){vec2 m = gl_PointCoord.xy; if(m.x < (0.5*m.y + 0.5) && m.x > (-0.5*m.y + 0.5)) {gl_FragColor = _color;} else {gl_FragColor = vec4(0.0);}}"
}

private async renderGeography(geojson, geoType, layerID, isForImageSave = false) {
	// get layer
	const relevantLayer = this.queryState.mapView.layers.filter(layer => layer.layerID == layerID)[0];

	// set layer to loading
	relevantLayer.isRendering = true;
	await new Promise(r => setTimeout(r));

	// clear layer if extant
	if(relevantLayer.renderObject !== null) {
		this.clearGeography(relevantLayer);
	}	

	let visualOptions: any = {
		color: hexToRgb(relevantLayer.color),
		opacity: relevantLayer.opacity,
	}
	console.log(geoType)
	if(geoType == 'geoPoint') {
		visualOptions.size = relevantLayer.size;
		visualOptions.sensitivity = 1;
		visualOptions.fragmentShaderSource = this.shaderLookup[relevantLayer.pointType];
	} else if(geoType == 'geoLine') {
		visualOptions.sensitivity = 0.06;
		visualOptions.weight = 6;
	} else if(geoType == 'geoRegion') {
		visualOptions.sensitivity = 0.06;
		visualOptions.border = true;
		visualOptions.borderOpacity = 1;
	}

	const glifyObject = {
		...visualOptions,
		map: this.map,
		preserveDrawingBuffer: isForImageSave,
		data: geojson,
		//sensitivity: 0.01,
		click: (e, feature) => {
			// Get the value from its row
			const {
				_index
			} = feature.properties;
			//console.log(relevantLayer, _index)
			const valueArray = relevantLayer.data.tableData[_index];
			const headerArray = relevantLayer.data.headerNames;
			const primaryKey = relevantLayer.data.primaryKeys[_index]
			const popupID: any = Math.ceil(Math.random()*100000);
			// Create an HTML template for every header and value in the row and geography
			let popupHTML = '<div class="flex flex-col mt-2" style="width: 300px; max-height: 300px;">';
			// copy GeoJSON
			popupHTML += `
				<button id="${popupID}" class=" border p-3 m-2 inline border-[#569CD7] rounded hover:bg-[#a3c5e0] shadow" style="margin: 10px 20px 20px 10px; font-weight: 400;
				font-size: 1rem;
				line-height: 1.2;
				letter-spacing: 0.0065em;">
					<span class="standard-button-text text-[#569CD7]">
						Copy GeoJSON
					</span>
				</button>
			`;
			// geographic value
			popupHTML += `
				<div style="overflow-y: scroll">
					<div style="font-size: 14px; font-weight: 300; color: #a0a0a0">
						Geometry
					</div>
			`;
			popupHTML += formatPopupTemplate('Type', geoType.slice(3));
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
				popupHTML += formatPopupTemplate(headerArray[i], [primaryKey, ...valueArray][i]);
			}
			// close div
			popupHTML += '</div></div>'

			// Create a unique datetime, so the popup class can be referenced uniquely
			let now = Date.now();
			L.popup({
				className: 'map-popup-' + now,
				closeButton: false
			})
			.setLatLng(e.latlng)
			.setContent(popupHTML)
			.openOn(this.map);

			// add copygeojson click listener
			let popupIDElement = document.getElementById(popupID);
			popupIDElement.addEventListener('click',() => {
				feature = Object.assign({}, feature);
				feature.properties = {};
				feature.properties[headerArray[0]] = primaryKey;
				for(let i = 1; i < headerArray.length; i++) {
					feature.properties[headerArray[i]] = valueArray[i - 1];
				}
				// switch coord order!
				feature.geometry.coordinates.reverse();
				this.clipboard.copy(JSON.stringify(feature));
				this.toastr.success('Copied to clipboard')
			});

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
	};

	glify.latitudeFirst();
	let gl;
	if(geoType == 'geoPoint') {
		gl = glify.points(glifyObject);
	} else if(geoType == 'geoLine') {
		gl = glify.lines(glifyObject);
	} else if(geoType == 'geoRegion') {
		gl = glify.shapes(glifyObject);
	}

	// add to the layer
	relevantLayer.renderObject = gl;

	relevantLayer.isRendering = false;

	function hexToRgb(hex) {
		if (hex.length < 6) return null;
		hex = hex.toLowerCase();
	
		if (hex[0] === '#') {
			hex = hex.substring(1, hex.length);
		}
	
		var r = parseInt(hex[0] + hex[1], 16),
		g = parseInt(hex[2] + hex[3], 16),
		b = parseInt(hex[4] + hex[5], 16);
		return {
			r: r / 255,
			g: g / 255,
			b: b / 255
		};
	}
}

private clearGeography(layer) {
	if(layer.renderObject) {
		layer.renderObject.remove();
		layer.renderObject = null;
	}
}

private rowDataToFeatureCollection(rowData, geospatialReturnableIDIndex) {
	return {
		type: 'FeatureCollection',
		features: rowData
			.map(row => JSON.parse(row[geospatialReturnableIDIndex]))
			.map((geojson, i) => ({
				type: 'Feature',
				geometry: geojson,
				properties: {
					_index: i
				}
			}))
		};
}

savingImage = false;
async saveMapImage() {
	this.savingImage = true;
	// rerender all layers with preserveDrawingBuffer = true
	for(let layer of this.queryState.mapView.layers) {
		const { type, layerID, geospatialReturnableIDIndex } = layer;
		let { tableData } = layer.data;
		// convert to rowData
		let featureCollection = this.rowDataToFeatureCollection(tableData, geospatialReturnableIDIndex);
		// rerender
		await this.renderGeography(featureCollection, type, layerID, true);
	}
	// Save to a file
	leafleatImage(this.map, (err, canvas) => {
		let mapLink = document.createElement('a');
		mapLink.download = 'TheDataGridMap.png';
		mapLink.href = canvas.toDataURL()
		mapLink.click();
		mapLink.remove();
		this.savingImage = false;
		this.toastr.success('Downloaded current map')
	})
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

updateColor(e, layerID) {
	let layerToUpdate = this.queryState.mapView.layers.filter(layer => layer.layerID == layerID)[0];
	layerToUpdate.color = e.target.value;
	// update current layer if extant
	if(layerToUpdate.hasQueried) {
		const { type, layerID, geospatialReturnableIDIndex } = layerToUpdate;
		let { tableData } = layerToUpdate.data;
		// convert to rowData
		let featureCollection = this.rowDataToFeatureCollection(tableData, geospatialReturnableIDIndex)
		// rerender
		this.debounceRenderChange(featureCollection, type, layerID);
	}
}

updateVisibility(layer) {
	layer.isVisible = !layer.isVisible;
	// rerender
	if(layer.isVisible) {
		const { type, layerID, geospatialReturnableIDIndex } = layer;
		let { tableData } = layer.data;
		// convert to rowData
		let featureCollection = this.rowDataToFeatureCollection(tableData, geospatialReturnableIDIndex)
		// rerender
		this.debounceRenderChange(featureCollection, type, layerID);
	}
	// clear
	else {
		this.clearGeography(layer);
	}
}

sliderChanged(layer) {
	const { type, layerID, geospatialReturnableIDIndex } = layer;
	let { tableData } = layer.data;
	// convert to rowData
	let featureCollection = this.rowDataToFeatureCollection(tableData, geospatialReturnableIDIndex);
	// rerender
	layer.isRendering = true;
	this.debounceRenderChange(featureCollection, type, layerID);
}

updatePointType(layer) {
	// update type
	layer.pointType = layer.pointType == 3 ? 1 : layer.pointType + 1;
	
	const { type, layerID, geospatialReturnableIDIndex } = layer;
	let { tableData } = layer.data;
	// convert to rowData
	let featureCollection = this.rowDataToFeatureCollection(tableData, geospatialReturnableIDIndex);
	// rerender
	this.debounceRenderChange(featureCollection, type, layerID);
}

formatPercent(float) {
	return Math.floor(float * 100) + '%';
}

renderChangeStack = 0;
private async debounceRenderChange(featureCollection, type, layerID) {
	// push to stack
	this.renderChangeStack++;
	console.log('Added to Stack')
	// wait 
	await new Promise(r => setTimeout(r, 500));
	// pop from stack
	this.renderChangeStack--;
	// if stack is empty then run()
	if(this.renderChangeStack == 0) {
		console.log('Running')
		this.renderGeography(featureCollection, type, layerID);
	}
}

removeLayer(layer) {
	const { layerID } = layer;
	const layerIndex = this.queryState.mapView.layers.map(layer => layer.layerID).indexOf(layerID);
	const layerName = this.queryState.mapView.layers[layerIndex].name;
	this.clearGeography(layer);
	this.queryState.mapView.layers.splice(layerIndex, 1);
	this.toastr.info('Removed Layer: ' + layerName, null, {positionClass: 'toast-top-left'});
}

expandAllLayers(expand) {
	this.queryState.mapView.layers.forEach(layer => layer.isExpanded = expand)
}

resetQueryState() {
	// Yes, this is somewhat bad code. This is easier than making a model
	this.queryState = {
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
			currentGeospatialFieldObjects: [],
	
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
				primaryKeys: [],
			}
		},
		mapView: {
			selectedDatabase: 0,
	
			queryType: 'Observations',
	
			selectedFeature: 2, //Sink
			featuresOrItems: [],

			selectedFields: [],
	
			// internal data
			currentFilterableColumnObjects: [],
			currentFilterableReturnableIDs: [],
			currentColumnObjects: [],
			currentReturnableIDs: [],
			currentColumnObjectIndices: [],
			currentGeospatialFieldObjects: [],
	
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
}

}