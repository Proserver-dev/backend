const API_RESULTS = require('../constants/apiResults')

const requireAdmin = async (req, res, next) => {
    if(req.user.roleId.short !== 'admin') {
        return res.status(API_RESULTS.ERR_ADMIN_PRIVILEGES_REQUIRED.status_code).json({ error: API_RESULTS.ERR_ADMIN_PRIVILEGES_REQUIRED.code });
    }
    next();
};

module.exports = requireAdmin;