// This script contains metadataFeatureInput and
// metadataColumn Input objects for globals and water audit.
// Keys for each object type are given below:

// ============================
// metadataFeatureInput
// ============================
// - tableName
// - parentTableName
// - frontendName
// - numFeatureRange
// - information
// - location (type)

// ============================
// metadataColumnInput
// ============================
// - featureName
// - rootFeatureName
// - columnName
// - tableName
// - referenceColumnName
// - referenceTableName
// - inputSelectorName
// - filterSelectorName
// - sqlDatatype
// - referenceDatatype
// - frontendDatatype
// - information
// - nullable
// - default
// - global
// - frontendName
// - groundTruthLocation

// ============================
// WATER AUDIT FEATURES
// ============================

newWaterAudit = JSON.parse(
'[{"tableName":"feature_toilet","parentTableName":null,"frontendName":"Toilet","numFeatureRange":null,"information":"A fixed receptacle into which a person may urinate or defecate","location":"item_room"},\
{"tableName":"feature_urinal","parentTableName":null,"frontendName":"Urinal","numFeatureRange":null,"information":"A bowl or other receptacle into which men may urinate","location":"item_room"},\
{"tableName":"subfeature_urinal_divider","parentTableName":"feature_urinal","frontendName":"Divider","numFeatureRange":1,"information":"Privacy barriers between adjacent urinals","location":null},\
{"tableName":"feature_sink","parentTableName":null,"frontendName":"Sink","numFeatureRange":null,"information":"A fixed basin with a water supply and a drain","location":"item_room"},\
{"tableName":"feature_mirror","parentTableName":null,"frontendName":"Mirror","numFeatureRange":null,"information":"A reflective surface that reflects a clear image","location":"item_room"},\
{"tableName":"feature_room","parentTableName":null,"frontendName":"Room","numFeatureRange":null,"information":"A part or division of a building enclosed by walls, floor, and ceiling","location":"item_room"}]')

// ============================
// GLOBAL AUDITING COLS
// ============================

let dynamicGlobalAudit = [

    {  // DATE CONDUCTED
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_date_conducted',
        tableName: null,
        referenceColumnName: null,
        referenceTableName: null,
        inputSelectorName: 'calendarEqual',
        filterSelectorName: 'calendarRange',
        sqlDatatype: 'DATE',
        referenceDatatype: 'local',
        frontendDatatype: 'date',
        information: 'Date the feature was audited',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Date Conducted',
        groundTruthLocation: null
    },
    {  // Auditor Name - special because it is a COALESCE between two cols
        featureName: null,
        rootFeatureName: null,
        columnName: null,
        tableName: null,
        referenceColumnName: null,
        referenceTableName: null,
        inputSelectorName: 'searchableChecklistDropdown',
        filterSelectorName: 'searchableChecklistDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'special',
        frontendDatatype: 'string',
        information: 'Name of the auditor(s) who conducted this observation',
        nullable: false, //this is weird because there are two cols, but one must not be null
        default: true,
        global: true,
        frontendName: 'Auditor Name',
        groundTruthLocation: null
    },
    {  // SOP NAME - special
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_name',
        tableName: 'tdg_sop',
        referenceColumnName: ['sop_id', 'sop_id', 'observation_count_id'],
        referenceTableName: ['tdg_sop', 'tdg_sop_m2m', 'tdg_sop_m2m'],
        inputSelectorName: 'searchableChecklistDropdown',
        filterSelectorName: 'searchableChecklistDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'special',
        frontendDatatype: 'hyperlink',
        information: 'The standard operating procedure(s) used for the audit on this feature',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Standard Operating Procedure',
        groundTruthLocation: null
    },
    {  // COMMENTARY
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_commentary',
        tableName: null,
        referenceColumnName: null,
        referenceTableName: null,
        inputSelectorName: 'text',
        filterSelectorName: null,
        sqlDatatype: 'TEXT',
        referenceDatatype: 'local',
        frontendDatatype: 'string',
        information: 'Additional commentary about the observation',
        nullable: true,
        default: true,
        global: true,
        frontendName: 'Commentary',
        groundTruthLocation: null
    }
];
  
let staticGlobalAudit = [

    {  // Template Name
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_template_name',
        tableName: 'item_template',
        referenceColumnName: ['item_id', 'item_template_id'],
        referenceTableName: ['item_template', 'tdg_submission'],
        inputSelectorName: null,
        filterSelectorName: 'searchableDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'submission',
        frontendDatatype: 'string',
        information: 'Name of the template used for the submission\'s upload',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Template',
        groundTruthLocation: null
    },
    {  // Submission name
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_submission_name',
        tableName: 'tdg_submission',
        referenceColumnName: null,
        referenceTableName: null,
        inputSelectorName: 'text',
        filterSelectorName: 'searchableDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'submission',
        frontendDatatype: 'string',
        information: 'Name of the audit submission',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Audit Submission Name',
        groundTruthLocation: null
    },
    {  // Submitting organization name
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_organization_name',
        tableName: 'item_organization',
        referenceColumnName: ['item_id', 'item_organization_id'],
        referenceTableName: ['item_organization', 'tdg_submission'],
        inputSelectorName: 'searchableDropdown',
        filterSelectorName: 'searchableChecklistDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'submission',
        frontendDatatype: 'string',
        information: 'Name of organization who submitted the audit',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Auditing Organization',
        groundTruthLocation: null
    },
    {  // University name that submitting organization belongs to
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_university_name',
        tableName: 'item_university',
        referenceColumnName: ['item_id', 'item_university_id', 'item_organization_id'],
        referenceTableName: ['item_university', 'item_organization', 'tdg_submission'],
        inputSelectorName: 'searchableDropdown',
        filterSelectorName: 'searchableChecklistDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'submission',
        frontendDatatype: 'string',
        information: 'Name of the university that organization who submitted the audit belongs to',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Auditing Organization University',
        groundTruthLocation: null
    },
];




let anotherTry = JSON.parse(newString)


module.exports = {
    newWaterAudit
};


/*
//!! OLD !!//

///////////////////////////
// custom creation tools //
///////////////////////////

// additional column constructor
const col = {
    data: function(name, type, nullable='') {return `data_${name} ${type} ${nullable}`},
    item: function(name, nullable='') {return `item_${name}_id INTEGER ${nullable}`},
}

//Schema entry structure example:
let example = {
    feature: {
        additionalCols: [
            col.data('some_rate', 'NUMERIC', "NOT NULL"),
            col.item('')
        ], //data or item columns for feature
        featureitem: {
            additionalCols: [], //data or item columns for featureitem of feature
            location: ''
        },
        lists: [], //names of lists associated with feature
        subfeatures: {}, //recursive
    }
}

///////////////////////////
// current audit schemas //
///////////////////////////

//Current water audits
const waterAudit = {
    toilet: {
        additionalCols: [
            col.data('gpf', 'NUMERIC', 'NOT NULL'),
            col.data('commentary', 'TEXT', '')
        ],
        featureitem: {location: 'item_room'}, 
        subfeatures: {
            flushometer: {
                featureitem: {location: 'item_room'},
                lists: ['brand', 'condition']
            },
            basin: {
                featureitem: {location: 'item_room'},
                lists: ['brand', 'condition']
            },
            stall: {
                featureitem: {location: 'item_room'},
                lists: ['condition']
            },
            sensor: {
                featureitem: {location: 'item_room'},
                lists: ['condition']
            }
        }
    },
    urinal: {
        additionalCols: [
            col.data('gpf', 'NUMERIC', 'NOT NULL'),
            col.data('commentary', 'TEXT', '')
        ],
        featureitem: {location: 'item_room'},
        subfeatures: {
            flushometer: {
                featureitem: {location: 'item_room'},
                lists: ['brand', 'condition']
            },
            basin: {
                featureitem: {location: 'item_room'},
                lists: ['brand', 'condition']
            },
            divider: {
                featureitem: {location: 'item_room'},
                lists: ['condition']
            },
            sensor: {
                featureitem: {location: 'item_room'},
                lists: ['condition']
            }
        }
    },
    sink: {
        additionalCols: [
            col.data('gpm', 'NUMERIC', 'NOT NULL'),
            col.data('commentary', 'TEXT', '')
        ],
        featureitem: {location: 'item_room'},
        subfeatures: {
            faucet: {
                featureitem: {location: 'item_room'},
                lists: ['brand', 'condition']
            },
            basin: {
                featureitem: {location: 'item_room'},
                lists: ['brand', 'condition']
            },
            sensor: {
                featureitem: {location: 'item_room'},
                lists: ['condition']
            }
        }
    },
    mirror: {
        featureitem: {location: 'item_room'},
        additionalCols: [
            col.data('commentary', 'TEXT', '')
        ],
        lists: ['condition']
    },
    room: {
        additionalCols: [
            col.data('exhaust_exit', 'BOOLEAN', ''),
            col.data('access_panel', 'BOOLEAN', ''),
            col.data('commentary', 'TEXT', '')
        ],
        featureitem: {location: 'item_room'}
    }
}
*/