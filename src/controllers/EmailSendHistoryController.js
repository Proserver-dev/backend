const { saveLogFromEndpointRequest } = require('../functions');
const API_RESULTS = require('../constants/apiResults')
const EmailSendHistory = require('../models/EmailSendHistoryModel')

async function getAllEmailSend(req, res) {
    /* 
    #swagger.tags = ['Admin']

    #swagger.parameters['limit'] = {
        in: 'query',
    }

    #swagger.parameters['offset'] = {
        in: 'query',
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            count: 1,
            rows: [
                { $ref: '#/definitions/EmailSendHistory' }
            ]
        }
    } 
    */

    saveLogFromEndpointRequest(req);

    const limit = req.query.limit
    const offset = req.query.offset

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    try {
        const emails = await EmailSendHistory.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit: parsedLimit,
            offset: parsedOffset,
        });

        res.json(emails);
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { getAllEmailSend }