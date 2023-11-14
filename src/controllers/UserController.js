const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')

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

        const usersWithRoles = await Promise.all(
            users.rows.map(async (user) => ({ ...user.toJSON(), role: await Role.findByPk(user.role) }))
        );

        const modifiedUsers = { ...users, rows: usersWithRoles };

        res.json(modifiedUsers);
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_USERS.status_code).json({ error: API_RESULTS.ERR_GET_USERS.code });
    }
}

const getMe = async (req, res) => {
    saveLogFromEndpointRequest(req)
    res.json(req.user);
}

module.exports = { getAllUsers, getMe }