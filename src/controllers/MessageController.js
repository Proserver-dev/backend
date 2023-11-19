const { Sequelize, Op } = require('sequelize');
const API_RESULTS = require('../constants/apiResults');
const { saveLogFromEndpointRequest } = require('../functions');
const MessageToAll = require('../models/MessageToAllModel')
const User = require('../models/UserModel')
const PrivateMessage = require('../models/PrivateMessageModel')
const PrivateMessageAttachment = require('../models/PrivateMessageAttachmentModel');
const UPLOAD_PATHS = require('../constants/uploadPaths');
const { SETTINGS } = require('../../settings')

async function getAllMessagesToAll(req, res) {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

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
    #swagger.tags = ['Private Messages']

    #swagger.parameters['userId'] = {
        in: 'path',
        required: true,
        description: "ID usera, z którym prowadzimy rozmowę"
    }

    #swagger.security = [{
        TokenAuth: []
    }]

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
        description: "Użytkownik nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_USER_NOT_EXISTS']
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

        const messagesWithFullData = await Promise.all(messages.rows.map(async (message) => {
            return await message.getFullData(); // dodaje attachments
        }));

        const result = {
            count: messages.count,
            rows: messagesWithFullData,
        }
    
        res.json(result);
    } catch (error) {
        console.error(error);
        // TODO: ten błąd chyba można zrobić bardziej generyczny, we wszystkich endpointach w takim przypadku błędu serwerowego
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

async function addPrivateMessage(req, res) {
    /*
    #swagger.tags = ['Private Messages']

    #swagger.parameters['userId'] = {
        in: 'path',
        required: true,
        description: "ID usera, z którym prowadzimy rozmowę"
    }

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            message: "Testowa wiadomość",
        }
    }

    #swagger.parameters['attachments'] = {
        in: 'formData',
        type: 'array',
        items: {
            type: 'file'
        },
        description: 'Tablica plików, załączniki do wiadomości',
    }

    #swagger.responses[400] = {
        description: 'Jeden z przesyłanych plików posiada niedozwolone rozszerzenie albo nie dostarczono wszystkich danych',
        schema: {
            error: ['ERR_INVALID_FILE_TYPE', 'ERR_PROVIDE_MESSAGE_FIELD']
        } 
    }

    #swagger.responses[413] = {
        description: 'Jeden z przesyłanych plików przekracza dozwolony rozmiar 5MB',
        schema: {
            error: 'ERR_FILE_SIZE_EXCEEDS_LIMIT'
        } 
    }

    #swagger.responses[404] = {
        description: 'User nie istnieje',
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_USER_NOT_EXISTS']
        } 
    }

    #swagger.responses[403] = {
        description: 'Nie możesz wysłać wiadomości do samego siebie',
        schema: {
            error: 'ERR_CANNOT_SEND_MESSAGE_TO_YOURSELF'
        } 
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[201] = {
        description: 'Wszystko poszło GIT',
        schema: { $ref: '#/definitions/PrivateMessage' }
    }

    */

    saveLogFromEndpointRequest(req);
    try {
        const message = req.body.message;
        const sourceUserId = req.user.id
        const targetUserId = req.params.userId

        const targetUser = await User.findByPk(targetUserId)
        if(!targetUser) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        if(targetUserId === sourceUserId) {
            return res.status(API_RESULTS.ERR_CANNOT_SEND_MESSAGE_TO_YOURSELF.status_code).json({ error: API_RESULTS.ERR_CANNOT_SEND_MESSAGE_TO_YOURSELF.code });
        }

        if(!message) {
            return res.status(API_RESULTS.ERR_PROVIDE_MESSAGE_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_MESSAGE_FIELD.code });
        }
    
        const newMessage = await PrivateMessage.create({
          sourceUserId,
          targetUserId,
          message,
        });
    
        // Przetwórz załączniki, jeśli istnieją
        if (req.files && req.files.length > 0) {
          const attachments = req.files.map((file) => ({
            privateMessageId: newMessage.id,
            url: SETTINGS.HOST+"/"+UPLOAD_PATHS.PRIVATE_MESSAGES_ATTACHMENTS+"/"+file.filename,
            type: 'image', // na razie statycznie, bo przyjmujemy tylko grafiki
          }));
    
          // Stwórz rekordy załączników w bazie danych
          await PrivateMessageAttachment.bulkCreate(attachments);
        }
    
        // Pobierz pełne dane wiadomości z użyciem metody getFullData
        const fullMessageData = await newMessage.getFullData();
    
        res.status(201).json(fullMessageData);
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

async function getActiveContacts(req, res) {
    /*
    #swagger.tags = ['Private Messages']
    #swagger.summary = 'zwraca tablicę userów z dodatkowym kluczem "lastMessage"'
    #swagger.parameters['limit'] = { description: "Liczba użytkowników na stronie", type: "integer" }
    #swagger.parameters['offset'] = { description: "Przesunięcie wyników", type: "integer" }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            count: 1,
            rows: [
                {
                    id: 1,
                    isActivated: true,
                    email: "john@doe.dev",
                    userName: "john123",
                    nameLastname: "John Doe",
                    role: 2,
                    isLoggedIn: true,
                    updatedAt: "2023-11-15T04:17:54.000Z",
                    createdAt: "2023-11-07T20:16:13.000Z",
                    lastMessage: {
                        "id": 30,
                        "sourceUserId": 1,
                        "targetUserId": 6,
                        "message": "siema siema",
                        "isRead": false,
                        "updatedAt": "2023-11-19T01:30:03.000Z",
                        "createdAt": "2023-11-19T01:30:03.000Z"
                    }
                }
            ]
        }
    } 

    */

    saveLogFromEndpointRequest(req);
    try {
        const user_id = req.user.id;
        const { limit, offset } = req.query;

        const limitValue = limit ? parseInt(limit) : 10;
        const offsetValue = offset ? parseInt(offset) : 0;

        const uniqueUserIDs = await PrivateMessage.findAll({
            attributes: ['sourceUserId', 'targetUserId'],
            where: {
                [Op.or]: [
                    { sourceUserId: user_id },
                    { targetUserId: user_id }
                ]
            },
            raw: true,
            nest: true
        });

        
        const distinctUserIDs = await [
            ...new Set(uniqueUserIDs.map(item => item.sourceUserId)),
            ...new Set(uniqueUserIDs.map(item => item.targetUserId))
        ].filter(id => id !== user_id);


        const { rows: usersWithLastMessage, count } = await User.findAndCountAll({
            where: {
                id: {
                    [Op.in]: distinctUserIDs
                }
            },
            include: [
                {
                    model: PrivateMessage,
                    attributes: ['id', 'sourceUserId', 'targetUserId', 'message', 'isRead', 'updatedAt', 'createdAt'],
                    as: 'sentMessages',
                    where: { targetUserId: user_id },
                    order: [['createdAt', 'DESC']],
                    limit: 1,
                    required: true
                },
                {
                    model: PrivateMessage,
                    attributes: ['id', 'sourceUserId', 'targetUserId', 'message', 'isRead', 'updatedAt', 'createdAt'],
                    as: 'receivedMessages',
                    where: { sourceUserId: user_id },
                    order: [['createdAt', 'DESC']],
                    limit: 1,
                    required: true
                }
            ],
            limit: limitValue,
            offset: offsetValue,
        });

        // Przetwarzaj wyniki, dodając klucz "lastMessage" do każdego użytkownika
        const usersWithLastMessageArray = usersWithLastMessage
            .map(user => {
                const lastMessageSent = user.sentMessages.length > 0 ? user.sentMessages[0] : null;
                const lastMessageReceived = user.receivedMessages.length > 0 ? user.receivedMessages[0] : null;

                if (lastMessageSent || lastMessageReceived) {
                    let lastMessage = lastMessageSent && lastMessageReceived
                        ? lastMessageSent.createdAt > lastMessageReceived.createdAt ? lastMessageSent : lastMessageReceived
                        : lastMessageSent || lastMessageReceived;

                    return {
                        ...user.toJSON(),
                        lastMessage
                    };
                }

                return null;
            })
            .filter(user => user !== null);

        usersWithLastMessageArray.sort((a, b) => {
            const createdAtA = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
            const createdAtB = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;

            return createdAtB - createdAtA;
        });

        res.status(200).json({ count, rows: usersWithLastMessageArray });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { getAllMessagesToAll, getPrivateMessages, addPrivateMessage, getActiveContacts }