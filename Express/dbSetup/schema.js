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

newWaterAudit = JSON.parse('[{"tableName":"feature_toilet","parentTableName":null,"frontendName":"Toilet","numFeatureRange":null,"information":"A fixed receptacle into which a person may urinate or defecate","location":"room"},{"tableName":"feature_urinal","parentTableName":null,"frontendName":"Urinal","numFeatureRange":null,"information":"A bowl or other receptacle into which men may urinate","location":"room"},{"tableName":"subfeature_urinal_divider","parentTableName":"feature_urinal","frontendName":"Divider","numFeatureRange":1,"information":"Privacy barriers between adjacent urinals","location":null},{"tableName":"feature_sink","parentTableName":null,"frontendName":"Sink","numFeatureRange":null,"information":"A fixed basin with a water supply and a drain","location":"room"},{"tableName":"feature_mirror","parentTableName":null,"frontendName":"Mirror","numFeatureRange":null,"information":"A reflective surface that reflects a clear image","location":"room"},{"tableName":"feature_room","parentTableName":null,"frontendName":"Room","numFeatureRange":null,"information":"A part or division of a building enclosed by walls, floor, and ceiling","location":"room"}]')

// GLOBAL AUDITING COLS //
[
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
    {  // SOP NAME **This kind of doesn't matter because all of these are custom**
        featureName: null,
        rootFeatureName: null,
        columnName: 'data_name',
        tableName: 'tdg_sop',
        referenceColumnName: ['sop_id', 'sop_id', 'observation_count_id'],
        referenceTableName: ['tdg_sop', 'tdg_sop_m2m', 'tdg_sop_m2m'],
        inputSelectorName: 'searchableChecklistDropdown',
        filterSelectorName: 'searchableChecklistDropdown',
        sqlDatatype: 'TEXT',
        referenceDatatype: 'local',
        frontendDatatype: 'date',
        information: 'Date the feature was audited',
        nullable: false,
        default: true,
        global: true,
        frontendName: 'Date Conducted',
        groundTruthLocation: null
    }
  ]
  























module.exports = {
    waterAudit,
    newWaterAudit
}