const API_RESULTS = require('../constants/apiResults');
const { saveLogFromEndpointRequest } = require('../functions');
const MessageToAll = require('../models/MessageToAllModel')

async function getAllMessagesToAll(req, res) {
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

        res.status(200).json(messages);
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_MESSAGES.status_code).json({ error: API_RESULTS.ERR_GET_MESSAGES.code });
    }
}

module.exports = { getAllMessagesToAll }