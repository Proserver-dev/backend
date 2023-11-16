const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')

async function getAllUsers(req, res) {
    /* 
    #swagger.tags = ['Users']

    #swagger.parameters['limit'] = {
        in: 'query',
    }

    #swagger.parameters['offset'] = {
        in: 'query',
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            count: 1,
            rows: [
                { $ref: '#/definitions/User' }
            ]
        }
    } 
    */

    saveLogFromEndpointRequest(req);

    const { limit, offset } = req.query;

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    try {
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

const getOneUser = async (req, res) => {
    /* 
    #swagger.tags = ['Users']

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { $ref: '#/definitions/User' }
    } 
    */

    saveLogFromEndpointRequest(req);
    try {
        if (req.params.id) {
            const user = await User.findByPk(req.params.id);
            if (user) {
                return res.json(user);
            } else {
                return res.json({});
            }
        }
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_USERS.status_code).json({ error: API_RESULTS.ERR_GET_USERS.code });
    }
}

const getMe = async (req, res) => {
    /* 
    #swagger.tags = ['Users']
    #swagger.description = "Zwraca obiekt aktualnie zalogowanego użytkownika"

    #swagger.parameters['Token'] = {
        in: 'header',
        required: true
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { $ref: '#/definitions/User' }
    } 
    */

    saveLogFromEndpointRequest(req)
    res.json(req.user);
}

module.exports = { getAllUsers, getOneUser, getMe }