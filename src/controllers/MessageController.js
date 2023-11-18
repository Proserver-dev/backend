const { Sequelize } = require('sequelize');
const API_RESULTS = require('../constants/apiResults');
const { saveLogFromEndpointRequest } = require('../functions');
const MessageToAll = require('../models/MessageToAllModel')
const User = require('../models/UserModel')
const PrivateMessage = require('../models/PrivateMessageModel')

async function getAllMessagesToAll(req, res) {
    /*
    #swagger.tags = ['Messages']
    #swagger.summary = 'tylko dla admina'

    */

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

async function getPrivateMessages(req, res) {
    /*
    #swagger.tags = ['Messages']

    #swagger.parameters['userId'] = {
        in: 'path',
        required: true,
        description: "ID usera, z którym prowadzimy rozmowę"
    }

    #swagger.parameters['Token'] = {
        in: 'header',
        required: true
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            count: 1,
            rows: [
                { $ref: '#/definitions/PrivateMessage' }
            ]
        }
    } 

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[404] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_USER_NOT_EXISTS'
        }  
    }

    */

    saveLogFromEndpointRequest(req);
    try {
        const limit = req.query.limit
        const offset = req.query.offset

        const targetUserId = parseInt(req.params.userId, 10);

        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        const parsedOffset = offset ? parseInt(offset, 10) : 0;


        const user = await User.findByPk(targetUserId);
        if(!user) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        // nie można mieć wiadomości ze samym sobą, więc zwracamy pustą tablicę
        if(targetUserId === req.user.id) {
            return res.json([])
        }
    
        const messages = await PrivateMessage.findAndCountAll({
            where: {
              [Sequelize.Op.or]: [
                { [Sequelize.Op.and]: [{ sourceUserId: req.user.id }, { targetUserId: targetUserId }] },
                { [Sequelize.Op.and]: [{ sourceUserId: targetUserId }, { targetUserId: req.user.id }] },
              ],
            },
            order: [['createdAt', 'DESC']],
            limit: parsedLimit,
            offset: parsedOffset,
          });

        // to może wymagać jeszcze przeróbki, doprecyzowania
        /// jeśli wiadomość została pobrana przez odbiorcę, to znaczy że została odczytana
        if (user.id === targetUserId) { // ten warunek chyba nie będzie potrzebny, jest zawarty w where SQL
            await PrivateMessage.update(
              { isRead: true },
              {
                where: {
                  sourceUserId: targetUserId,
                  targetUserId: req.user.id,
                  isRead: false,
                },
              }
            );
        }
    
        res.json(messages);
    } catch (error) {
        console.error(error);
        // TODO: ten błąd chyba można zrobić bardziej generyczny, we wszystkich endpointach w takim przypadku błędu serwerowego
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { getAllMessagesToAll, getPrivateMessages }