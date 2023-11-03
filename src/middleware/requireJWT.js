const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { SETTINGS } = require('../../settings');

const requireJWT = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Brak autoryzacji. Brak tokenu JWT.' });
  }

  try {
    const decoded = jwt.verify(token, SETTINGS.JWT_SECRET);

    // Zdekodowany obiekt JWT będzie zawierał dane, które mogą być użyte do autoryzacji
    // Na przykład, możesz uzyskać identyfikator użytkownika z decoded.userId

    // Pobranie użytkownika na podstawie identyfikatora z tokena
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik z tokena nie istnieje' });
    }

    if(token != user.loginToken) {
        return res.status(404).json({ error: 'Token jest nieaktualny' });
    }

    // Dodanie obiektu użytkownika do obiektu żądania, aby można go było użyć w innych obszarach ścieżek
    req.user = user;

    // Przesłanie autoryzacji dalej
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Nieprawidłowy token JWT.' });
  }
};

module.exports = requireJWT;