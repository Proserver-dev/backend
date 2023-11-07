const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { SETTINGS } = require('../../settings');
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')
const { logToFile } = require('../functions');

const requireJWT = async (req, res, next) => {
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

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logToFile(`run endpoint ${req.method} ${fullUrl} - login token expired`);
      return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_TOKEN_EXPIRED.code });
    } else {
      console.error(error);
      return res.status(API_RESULTS.ERR_VERIFY_TOKEN.status_code).json({ error: API_RESULTS.ERR_VERIFY_TOKEN.code });
    }
  }
};

module.exports = requireJWT;