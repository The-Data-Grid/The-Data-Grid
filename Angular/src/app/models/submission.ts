export interface SubmissionObject {
    items: {
        create: CreateItemObject[],
        update: any[]
        delete: any[],
        requestPermanentDeletion: any[]
    },
    observations: {
        create: any[],
        update: any[],
        delete: any[]
    }
}

export interface CreateItemObject {
    itemTypeID: Number,
    requiredItems: requiredItems[],
    newRequiredItemIndices: Number[],
    globalPrimaryKey: Number,
    newGlobalItemIndex: Number,
    data: {
        returnableIDs: Number[],
        data: any[]
    }
}

export interface requiredItems {
    itemTypeID: Number,
    primaryKey: Number
}