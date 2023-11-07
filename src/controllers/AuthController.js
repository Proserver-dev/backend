const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const { SETTINGS } = require('../../settings');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')

const userLogin = async (req, res) => {
    saveLogFromEndpointRequest(req)
    try {
        const { email, password } = req.body;
        const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

        if (!email || !password) {
            return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_DATA.status_code).json({ error: API_RESULTS.ERR_PROVIDE_LOGIN_DATA.code });
        }

        const user = await User.findOne({ where: { email } });
    
        if (!user) {
          return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        const user_role = await Role.findByPk(user.roleId)

        // konieczne do odświeżania loginToken
        if(!deviceToken && user_role?.short != "admin") {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }
    
        const passwordMatch = await bcrypt.compare(password, user.password);
    
        if (!passwordMatch) {
          return res.status(API_RESULTS.ERR_WRONG_PASSWORD.status_code).json({ error: API_RESULTS.ERR_WRONG_PASSWORD.code });
        }

        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });
        const refreshToken = jwt.sign({ userId: user.id, token: loginToken }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: SETTINGS.REFRESH_TOKEN.TTL });

        // jeśli user jeszcze nie ma role_id (jest nullem), to przy logowaniu od razu przypisujemy domyślną rolę
        if(!user.roleId) {
            const default_role = await Role.findOne({ where: { name: DEFAULT_ROLE } })
            if(default_role) {
                user.update({ roleId: default_role.id })
            }
        }

        if(!deviceToken) {
            await user.update({ loginToken });
        } else {
            await user.update({ loginToken, deviceToken });
        }

        user.roleId = await Role.findByPk(user.roleId)
    
        res.json({ token: loginToken, refreshToken, user });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_LOGIN_ERROR.status_code).json({ error: API_RESULTS.ERR_LOGIN_ERROR.code });
    }
}

const userRefreshToken = async (req, res) => {
    saveLogFromEndpointRequest(req)
    try {
        const refreshToken = req.header(HEADERS_KEYS.REFRESH_TOKEN);
        const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

        if(!refreshToken) {
            return res.status(API_RESULTS.ERR_PROVIDE_REFRESH_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_REFRESH_TOKEN.code });
        }

        const decodedRefreshToken = jwt.verify(refreshToken, SETTINGS.REFRESH_TOKEN.PUBLIC_KEY, { algorithms: SETTINGS.REFRESH_TOKEN.ALGORITHM });

        const user = await User.findByPk(decodedRefreshToken.userId);

        if (!user) {
            return res.status(API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.code });
        }

        if(user.loginToken !== decodedRefreshToken.token) {
            res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        }

        const user_role = await Role.findByPk(user.roleId)

        // ominięcie deviceToken jeśli token odświeża admin
        if(user_role?.short != "admin") {
            if(!deviceToken) {
                return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
            }

            if(deviceToken != user.deviceToken) {
                return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
            }
        }

        const newToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });

        await user.update({ loginToken: newToken });

        res.json({ token: newToken });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        } else {
            console.error(error);
            res.status(API_RESULTS.ERR_REFRESH_TOKEN.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN.code });
        }
    } 
}

module.exports = { userLogin, userRefreshToken }