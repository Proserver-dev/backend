const API_RESULTS = require('../constants/apiResults')

const requireAdmin = async (req, res, next) => {
    /*

    #swagger.responses[403] = { 
        description: "Wymagane uprawnienia admina",
        schema: {
            error: 'ERR_ADMIN_PRIVILEGES_REQUIRED'
        }  
  }

    */

    if(req.user.roleId.short !== 'admin') {
        return res.status(API_RESULTS.ERR_ADMIN_PRIVILEGES_REQUIRED.status_code).json({ error: API_RESULTS.ERR_ADMIN_PRIVILEGES_REQUIRED.code });
    }
    next();
};

module.exports = requireAdmin;