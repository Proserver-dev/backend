const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { SETTINGS } = require('../../settings');
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')

const requireJWT = async (req, res, next) => {
  const token = req.header(HEADERS_KEYS.LOGIN_TOKEN);

  if (!token) {
    return res.status(401).json({ error: 'Brak autoryzacji. Brak tokenu JWT.' });
  }

  try {
    const decoded = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.status_code).json({ code: API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.code });
    }

    if(token != user.loginToken) {
        return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ code: API_RESULTS.ERR_TOKEN_EXPIRED.code });
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ code: API_RESULTS.ERR_TOKEN_EXPIRED.code });
    } else {
      console.error(error);
      return res.status(API_RESULTS.ERR_VERIFY_TOKEN.status_code).json({ code: API_RESULTS.ERR_VERIFY_TOKEN.code });
    }
  }
};

module.exports = requireJWT;