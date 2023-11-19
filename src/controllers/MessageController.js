const { Sequelize } = require('sequelize');
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

    #swagger.parameters['Token'] = {
        in: 'header',
        required: true
    }

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

module.exports = { getAllMessagesToAll, getPrivateMessages, addPrivateMessage }