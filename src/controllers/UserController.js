const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const { SETTINGS } = require('../../settings');

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const deviceToken = req.header('Device-Token');

        if (!email || !password) {
            return res.status(400).json({ error: 'Musisz wprowadzić dane logowania' });
        }

        // konieczne do odświeżania loginToken
        if(!deviceToken) {
            return res.status(400).json({ error: 'Musisz przekazać Device-Token w nagłówku' });
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

        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });
        const refreshToken = jwt.sign({ userId: user.id }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: SETTINGS.REFRESH_TOKEN.TTL });

        await user.update({ loginToken, deviceToken });
    
        res.json({ token: loginToken, refreshToken, user: user.toJSON() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd logowania' });
    }
}

const userRegister = async (req, res) => {
    try {
        const { email, password, userName, nameLastname } = req.body;
        const deviceToken = req.header('Device-Token');

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
        const user = await User.create({ email, password: hashedPassword, userName, nameLastname, deviceToken });
    
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd rejestracji' });
    }
}

const userRefreshToken = async (req, res) => {
    try {
        const refreshToken = req.header('Refresh-Token');
        const deviceToken = req.header('Device-Token');

        const decodedRefreshToken = jwt.verify(refreshToken, SETTINGS.REFRESH_TOKEN.PUBLIC_KEY, { algorithms: SETTINGS.REFRESH_TOKEN.ALGORITHM });

        const user = await User.findByPk(decodedRefreshToken.userId);

        if (!user) {
            return res.status(404).json({ error: 'Użytkownik z tokena nie istnieje' });
        }

        if(deviceToken != user.deviceToken) {
            return res.status(401).json({ error: 'Device-Token jest niepoprawny' });
        }

        const newToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });

        await user.update({ loginToken: newToken });

        res.json({ token: newToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd odświeżania tokena' });
    } 
}

module.exports = { userLogin, userRegister, userRefreshToken }