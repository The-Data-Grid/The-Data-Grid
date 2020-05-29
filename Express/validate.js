// We will validate the columns that can be filtered by 

const validate = {
    toilet: {
        column: [
            'gpf', 'commentary', 'date_conducted', 'flushometer_condition_name',
            'flushometer_brand_name', 'basin_condition_name', 'basin_brand_name',
            'stall_condition_name', 'sensor_condition_name', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ],
        filter: [
            'gpf', 'date_conducted', 'flushometer_condition_name',
            'flushometer_brand_name', 'basin_condition_name', 'basin_brand_name',
            'stall_condition_name', 'sensor_condition_name', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ]
    },
    urinal: {
        column: [
            'gpf', 'commentary', 'date_conducted', 'flushometer_condition_name',
            'flushometer_brand_name', 'basin_condition_name', 'basin_brand_name',
            'divider_condition_name', 'sensor_condition_name', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ],
        filter: [
            'gpf', 'date_conducted', 'flushometer_condition_name',
            'flushometer_brand_name', 'basin_condition_name', 'basin_brand_name',
            'divider_condition_name', 'sensor_condition_name', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ]
    },
    sink: {
        column: [
            'gpm', 'commentary', 'date_conducted', 'basin_condition_name', 'faucet_condition_name',
            'sensor_condition_name', 'room_number', 'faucet_brand_name',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ],
        filter: [
            'gpf', 'date_conducted', 'basin_condition_name', 'faucet_condition_name',
            'sensor_condition_name', 'room_number', 'faucet_brand_name',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ]
    },
    mirror: {
        column: [
            'commentary', 'date_conducted', 'condition_name', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ],
        filter: [
            'date_conducted', 'condition_name', 'room_number', 
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ]
    },
    room: {
        column: [
            'exhaust_exit', 'access_panel', 'commentary', 'date_conducted', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ],
        filter: [
            'exhaust_exit', 'access_panel', 'date_conducted', 'room_number',
            'building_name', 'community_name', 'date_submitted',
            'template_name', 'sop_name', 'organization_name'
        ]
    }
}


module.exports = validate;