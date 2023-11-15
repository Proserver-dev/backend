const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')

async function getAllUsers(req, res) {
    // #swagger.tags = ['Users']

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
            users.rows.map(async (user) => ({ ...user.toJSON(), role: await Role.findByPk(user.roleId) }))
        );

        const modifiedUsers = { ...users, rows: usersWithRoles };

        res.json(modifiedUsers);
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_USERS.status_code).json({ error: API_RESULTS.ERR_GET_USERS.code });
    }
}

const getMe = async (req, res) => {
    // #swagger.tags = ['Users']
    saveLogFromEndpointRequest(req)

    /* 
    #swagger.responses[200] = {
        description: 'Zwraca obiekt aktualnie zalogowanego użytkownika',
        schema: {
            id: 1,
            isActivated: true,
            email: "john@doe.dev",
            userName: "john123",
            nameLastname: "John Doe",
            role: {
                id: 1,
                name: "User",
                short: "user"
            },
            isLoggedIn: true,
            updatedAt: "2023-11-15T04:17:54.000Z",
            createdAt: "2023-11-07T20:16:13.000Z"
        }
    } 
    */
    res.json(req.user);
}

module.exports = { getAllUsers, getMe }