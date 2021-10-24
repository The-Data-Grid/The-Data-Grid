const isTesting = ['-t', '--test'].includes(process.argv[2]);

module.exports = (req, res, next) => {
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