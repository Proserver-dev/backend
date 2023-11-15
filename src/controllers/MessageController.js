const API_RESULTS = require('../constants/apiResults');
const { saveLogFromEndpointRequest } = require('../functions');
const MessageToAll = require('../models/MessageToAllModel')
const User = require('../models/UserModel')

async function getAllMessagesToAll(req, res) {
    // #swagger.tags = ['Admin']

    saveLogFromEndpointRequest(req);

    try {
        const { limit, offset } = req.query;

        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        const parsedOffset = offset ? parseInt(offset, 10) : 0;

        const messages = await MessageToAll.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit: parsedLimit,
            offset: parsedOffset,
        });

        const userIds = Array.from(new Set(messages.rows.map((message) => message.sendBy)));

        const users = await Promise.all(userIds.map((userId) => User.findByPk(userId)));

        const messagesWithUsers = messages.rows.map((message) => ({
        ...message.toJSON(),
        sendBy: users.find((user) => user.id === message.sendBy),
        }));

        res.status(200).json({ count: messages.count, rows: messagesWithUsers });
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_MESSAGES.status_code).json({ error: API_RESULTS.ERR_GET_MESSAGES.code });
    }
}

module.exports = { getAllMessagesToAll }