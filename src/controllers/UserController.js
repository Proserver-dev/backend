const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')

const userRegister = async (req, res) => {
    saveLogFromEndpointRequest(req)
    try {
        const { email, password, userName, nameLastname } = req.body;
        const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!password) {
            return res.status(API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.code });
        }

        const userExist = await User.findOne({ where: { email } });

        if (userExist) {
            return res.status(API_RESULTS.ERR_USER_ALREADY_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_ALREADY_EXISTS.code });
        }

        let default_role = await Role.findOne({ where: { name: DEFAULT_ROLE } })

        if(default_role) {
            default_role = default_role.id
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, userName, nameLastname, deviceToken, roleId: default_role });
    
        res.status(API_RESULTS.SUCCESS_USER_REGISTERED.status_code).json({ success: API_RESULTS.SUCCESS_USER_REGISTERED.code, user });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_REGISTER_ERROR.status_code).json({ error: API_RESULTS.ERR_REGISTER_ERROR.code });
    }
}

async function getAllUsers(req, res) {
    saveLogFromEndpointRequest(req);

    const { limit, offset } = req.query;

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    try {
        if (req.params.id) {
            const user = await User.findByPk(req.params.id);
            if (user) {
                return res.json(user);
            } else {
                return res.json({});
            }
        }

        const users = await User.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit: parsedLimit,
            offset: parsedOffset,
        });

        res.json(users);
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_USERS.status_code).json({ error: API_RESULTS.ERR_GET_USERS.code });
    }
}

const getMe = async (req, res) => {
    saveLogFromEndpointRequest(req)
    res.json(req.user);
}

module.exports = { userRegister, getAllUsers, getMe }