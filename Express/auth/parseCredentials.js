const isTesting = ['-t', '--test'].includes(process.argv[2]);

// Database connection and SQL formatter (for API Key)
const {postgresClient} = require('../pg.js');
// get connection object
const formatSQL = postgresClient.format;
// SQL Statements
const { apiKeyAuthorization } = require('../statement.js').login;

module.exports = async (req, res, next) => {
    const db = res.locals.databaseConnection;
    // Testing
    if(isTesting) {
        let {
            privilege,
            role,
            organizationid,
            userid,
        } = req.headers;

        if(role === null) {
            role = [];
        } else {
            role = [role];
        }

        if(organizationid === null) {
            organizationid = [];
        } else {
            organizationid = [parseInt(organizationid)];
        }

        res.locals.authorization = {
            privilege,
            role,
            organizationID: organizationid,
            userID: parseInt(userid),
        };

        return next();
    }
    // Production
    else {
        // Check for API Key
        if('X-API-KEY' in req.headers) {
            try {
                // Hit database
                const sessionData = await db.one(formatSQL(apiKeyAuthorization, { apiKey: req.headers['X-API-KEY'] }));
                const sessionObject = {
                    loggedIn: true,
                    firstName: sessionData.firstName,
                    lastName: sessionData.lastName,
                    email: sessionData.email,
                    role: sessionData.role,
                    userID: sessionData.userID,
                    organizationID: sessionData.organizationID,
                    organizationFrontendName: sessionData.organizationName,
                    privilege: sessionData.privilege,
                    isApiKeySet: sessionData.isApiKeySet // Boolean of whether an api key has been set yet, not exposing api key itself in cookie
                };
                // Attach user data to request
                res.locals.authorization = sessionObject;

                return next();
            } 
            // Then API key is invalid
            catch(err) {
                return res.status(401).end();
            }
        } 
        // Otherwise session must exist in memory
        else {
            if(req.session.loggedIn) {
                res.locals.authorization = req.session;
            } else {
                res.locals.authorization = {
                    privilege: 'guest',
                    role: [],
                    organizationID: [],
                    userID: null,
                };
            }
            return next();
        }
    }
}