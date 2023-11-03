const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const { SETTINGS } = require('../../settings');

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Musisz wprowadzić dane logowania' });
        }

        const user = await User.findOne({ where: { email } });
    
        if (!user) {
          return res.status(404).json({ error: 'Użytkownik nie istnieje' });
        }
    
        user.passwordVisible = true;
        const passwordMatch = await bcrypt.compare(password, user.password);
        user.passwordVisible = false;
    
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Niepoprawne hasło' });
        }
    
        // Tworzenie JWT tokena
        const token = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET);

        await user.update({ loginToken: token });

        // i poźniej tam gdzie będziemy go sprawdzać (przy endpointach, middleware) dodatkowo sprawdzać, czy przekazany token jest zgodny z tym, który jest w bazie
        // jeśli nie, to zwrócić błąd - ten błąd później musi być obsłużony w aplikacji do wylogowania

        // TODO do użycia w innych endpointach, do weryfikacji przesłanego tokena z kolumną tokenLogin
        /* 
        if (token !== user.tokenLogin) {
            return res.status(401).json({ error: 'Nieprawidłowy token' });
        }
        */
    
        res.json({ token, user: user.toJSON() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd logowania' });
    }
}

const userRegister = async (req, res) => {
    try {
        const { email, password, userName, nameLastname } = req.body;

        console.log(req.body)

        if (!email) {
            return res.status(400).json({ error: 'Musisz wypełnić pole "email"' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Musisz wypełnić pole "password"' });
        }

        const userExist = await User.findOne({ where: { email } });

        if (userExist) {
            return res.status(404).json({ error: 'Użytkownik z takim mailem już istnieje' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, userName, nameLastname });
    
        // TODO Tworzenie JWT tokena, jeśli user ma być od razu zalogowany
        const token = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET);
        user.update({ tokenLogin: token });
    
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd rejestracji' });
    }
}

module.exports = { userLogin, userRegister }