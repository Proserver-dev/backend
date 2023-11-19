const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { SETTINGS } = require('../../settings');
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')
const { logToFile } = require('../functions');

const requireJWT = async (req, res, next) => {
  /*

  #swagger.responses[400] = { 
        description: "Musisz dostarczyć Token w nagłówku",
        schema: {
            error: 'ERR_PROVIDE_LOGIN_TOKEN'
        }  
  }

  #swagger.responses[401] = { 
        description: "Token logowania wygasł lub jest niepoprawny",
        schema: {
            error: ['ERR_TOKEN_EXPIRED', 'ERR_VERIFY_TOKEN']
        }  
  }

  #swagger.responses[404] = { 
        description: "Udało się zdekodować Token z nagłówka, ale user_id w nim zakodowany nie istnieje w bazie",
        schema: {
            error: 'ERR_USER_FROM_TOKEN_NOT_EXISTS'
        }  
    }


  */

  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  const token = req.header(HEADERS_KEYS.LOGIN_TOKEN);

  if (!token) {
    return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.code });
  }

  try {
    const decoded = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.code });
    }

    if(token != user.loginToken) {
        logToFile(`run endpoint ${req.method} ${fullUrl} - login token expired`);
        return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_TOKEN_EXPIRED.code });
    }

    const user_role = await Role.findByPk(user.roleId)
    user.roleId = user_role
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // tutaj nie jesteśmy w stanie wyczyścić loginToken usera, bo nie wiemy do kogo należał ten wygaśnięty token
      logToFile(`run endpoint ${req.method} ${fullUrl} - login token expired`);
      return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_TOKEN_EXPIRED.code });
    } else {
      console.error(error);
      return res.status(API_RESULTS.ERR_VERIFY_TOKEN.status_code).json({ error: API_RESULTS.ERR_VERIFY_TOKEN.code });
    }
  }
};

module.exports = requireJWT;