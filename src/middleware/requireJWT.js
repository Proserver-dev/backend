const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { SETTINGS } = require('../../settings');

const requireJWT = async (req, res, next) => {
  const token = req.header('Token');

  if (!token) {
    return res.status(401).json({ error: 'Brak autoryzacji. Brak tokenu JWT.' });
  }

  try {
    const decoded = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik z tokena nie istnieje' });
    }

    if(token != user.loginToken) {
        return res.status(401).json({ error: 'Token jest nieaktualny' });
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Błąd weryfikacji tokenu' });
  }
};

module.exports = requireJWT;