const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const { saveLogFromEndpointRequest } = require('../functions');
const { SETTINGS } = require('../../settings');
const HEADERS_KEYS = require('../constants/headers_keys')
const API_RESULTS = require('../constants/api_results')

const userLogin = async (req, res) => {
    saveLogFromEndpointRequest(req)
    try {
        const { email, password } = req.body;
        const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

        if (!email || !password) {
            return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_DATA.status_code).json({ code: API_RESULTS.ERR_PROVIDE_LOGIN_DATA.code });
        }

        // konieczne do odświeżania loginToken
        if(!deviceToken) {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ code: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }

        const user = await User.findOne({ where: { email } });
    
        if (!user) {
          return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ code: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }
    
        user.passwordVisible = true;
        const passwordMatch = await bcrypt.compare(password, user.password);
        user.passwordVisible = false;
    
        if (!passwordMatch) {
          return res.status(API_RESULTS.ERR_WRONG_PASSWORD.status_code).json({ code: API_RESULTS.ERR_WRONG_PASSWORD.code });
        }

        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });
        const refreshToken = jwt.sign({ userId: user.id }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: SETTINGS.REFRESH_TOKEN.TTL });

        await user.update({ loginToken, deviceToken });
    
        res.json({ token: loginToken, refreshToken, user: user.toJSON() });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_LOGIN_ERROR.status_code).json({ code: API_RESULTS.ERR_LOGIN_ERROR.code });
    }
}

const userRegister = async (req, res) => {
    saveLogFromEndpointRequest(req)
    try {
        const { email, password, userName, nameLastname } = req.body;
        const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ code: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!password) {
            return res.status(API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.status_code).json({ code: API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.code });
        }

        const userExist = await User.findOne({ where: { email } });

        if (userExist) {
            return res.status(API_RESULTS.ERR_USER_ALREADY_EXISTS.status_code).json({ code: API_RESULTS.ERR_USER_ALREADY_EXISTS.code });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, userName, nameLastname, deviceToken });
    
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_REGISTER_ERROR.status_code).json({ code: API_RESULTS.ERR_REGISTER_ERROR.code });
    }
}

const userRefreshToken = async (req, res) => {
    saveLogFromEndpointRequest(req)
    try {
        const refreshToken = req.header(HEADERS_KEYS.REFRESH_TOKEN);
        const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

        if(!deviceToken) {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ code: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }

        if(!refreshToken) {
            return res.status(API_RESULTS.ERR_PROVIDE_REFRESH_TOKEN.status_code).json({ code: API_RESULTS.ERR_PROVIDE_REFRESH_TOKEN.code });
        }

        const decodedRefreshToken = jwt.verify(refreshToken, SETTINGS.REFRESH_TOKEN.PUBLIC_KEY, { algorithms: SETTINGS.REFRESH_TOKEN.ALGORITHM });

        const user = await User.findByPk(decodedRefreshToken.userId);

        if (!user) {
            return res.status(API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.status_code).json({ code: API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.code });
        }

        if(deviceToken != user.deviceToken) {
            return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ code: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        const newToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });

        await user.update({ loginToken: newToken });

        res.json({ token: newToken });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ code: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        } else {
            console.error(error);
            res.status(API_RESULTS.ERR_REFRESH_TOKEN.status_code).json({ code: API_RESULTS.ERR_REFRESH_TOKEN.code });
        }
    } 
}

module.exports = { userLogin, userRegister, userRefreshToken }