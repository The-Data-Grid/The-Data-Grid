// Functions that query the database directly with little formatting
// used by parts of the API that need to make small specialized queries

// Database connection and SQL formatter
const {postgresClient} = require('../db/pg.js');
// get connection object
const db = postgresClient.getConnection.db
// get SQL formatter
const formatSQL = postgresClient.format;
// crypto id creator for API key
const { nanoid } = require('nanoid');

async function auditManagment(req, res) {
    try {

        const data = (await db.any(formatSQL(`
            SELECT 
                a.data_audit_name as "name",
                a.data_time_created as "createdAt",
                concat(au.data_first_name, ' ', au.data_last_name) as "createdBy",
                array_remove(array_agg(coalesce(mf.frontend_name, mi.frontend_name)), NULL) as "feature",
                array_remove(array_agg(s.upload_type), NULL) as "itemOrObs",
                array_remove(array_agg(gu.data_first_name), NULL) as "uploadedByFirst",
                array_remove(array_agg(gu.data_last_name), NULL) as "uploadedByLast",
                array_remove(array_agg(g.time_submitted), NULL) as "uploadedAt",
                array_remove(array_agg(s.file_key), NULL) as "spreadsheetLink"
                    FROM item_audit as a
                    LEFT JOIN item_global as g on g.item_audit_id = a.item_id
                    LEFT JOIN tdg_spreadsheet_upload as s on g.spreadsheet_id = s.upload_id
                    LEFT JOIN item_user as au on a.item_user_id = au.item_id
                    LEFT JOIN metadata_feature as mf on s.feature_id = mf.feature_id
                    LEFT JOIN metadata_item as mi on s.item_id = mi.item_id
                    LEFT JOIN item_user as gu on gu.item_id = g.item_user_id
                        WHERE a.item_organization_id = $(organizationID)
                        GROUP BY "name", "createdAt", "createdBy"
                        ORDER BY "createdAt" DESC
        `, {
            organizationID: req.query.organizationID
        }))).map(audit => {
            const {
                feature,
                itemOrObs,
                uploadedByFirst,
                uploadedByLast,
                uploadedAt,
                spreadsheetLink,
            } = audit;
            const formattedUploads = uploadedAt.map((u, i) => ({
                feature: feature[i],
                itemOrObs: itemOrObs[i],
                uploadedBy: `${uploadedByFirst[i]} ${uploadedByLast[i]}`,
                uploadedAt: u,
                spreadsheetLink: spreadsheetLink[i]
            }));
            return {
                name: audit.name,
                createdAt: audit.createdAt,
                createdBy: audit.createdBy,
                uploads: formattedUploads
            };
        });

        const dataAndCount = {
            count: data.length,
            audits: data
        }

        return res.status(200).json(dataAndCount);
    } catch(err) {
        console.log(err)
        return res.status(500).end();
    }
}

async function sopManagement(req, res) {
    try {
        const data = await db.any(formatSQL(`
            SELECT
                data_name as "name",
                data_body as "link",
                data_time_uploaded as "createdAt",
                item_id as "id"
                FROM item_sop
                WHERE item_organization_id = $(organizationID)
        `, {
            organizationID: req.query.organizationID
        }));

        return res.json(data).end();
    } catch(err) {
        console.log(err)
        return res.status(500).end();
    }
}

async function getPresetValues(columnName, tableName) {
    const data = (await db.any(formatSQL(`
        SELECT $(columnName:name) as "data" FROM $(tableName:name)
    `, {
        columnName,
        tableName
    }))).map(e => e.data);

    return data;
}

function generateApiKey(config) {
    return async function(req, res) {
        const { userID } = res.locals.authorization;

        let key = null;
        if(!config.remove) {
            key = nanoid(50);
        }

        try {
            await db.none(formatSQL(`
                UPDATE item_user SET api_key = $(key) WHERE item_id = $(userID)
            `, {
                key,
                userID
            }));

            if(config.remove) {
                return res.status(200).end();
            } else {
                return res.status(201).json({ key });
            }
        } catch (err) {
            return res.status(500).end();
        }

    }
}

module.exports = {
    auditManagment,
    sopManagement,
    getPresetValues,
    generateApiKey,
}