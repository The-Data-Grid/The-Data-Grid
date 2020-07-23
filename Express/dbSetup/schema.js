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

module.exports = {
    waterAudit
}