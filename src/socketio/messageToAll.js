const { Sequelize } = require('sequelize');
const { logToFile } = require('../../src/functions');
const MessageToAll = require('../models/MessageToAllModel');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const AuthHistory = require('../models/AuthHistory')
const SOCKET_EVENTS = require('../constants/socketEvents');
const API_RESULTS = require('../constants/apiResults');
const SOCKET_RESPONSES = require('../constants/socketResponses');

async function messageToAll(io, socket, data, currentUserId) {
    const { message, type } = data

    if(!type) {
        data = {
            ...data,
            type: 'info'
        }
    }

    if(type == 'forceLogout' && !message) {
        data = {
            ...data,
            message: null
        }
    }

    if(message || type == 'forceLogout') {
        // TODO: to trochę spowalnia emisję, ale to sprawdzenie musi być, żeby tylko admin mógł taką emisję zrobić
        const currentUser = await User.findByPk(currentUserId);
        const role = await Role.findByPk(currentUser.roleId); // admin role
        if(role.short === "admin") {
            logToFile(`Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ALL} | target: all | message: ${data.message} | type: ${data.type} | sendBy: ${currentUser.id}`);
            MessageToAll.create({ sendBy: currentUser.id, message: data.message, type: data.type })

            if(data.type == "forceLogout") {
                try {
                      // wszyscy użytkownikcy, których roleId jest różne od role.id admina i loginToken jest różny od null
                      const usersToLogout = await User.findAll({
                        where: {
                          roleId: { [Sequelize.Op.ne]: role.id },
                          loginToken: { [Sequelize.Op.ne]: null },
                        },
                      });
                  
                      const updatePromises = usersToLogout.map(async (user) => {
                        await User.update({ loginToken: null }, { where: { id: user.id } });
                      });

                      usersToLogout.map(async (user) => {
                        const userSocket = getSocketIdByUserId(user.id)
                        io.to(userSocket).emit(SOCKET_EVENTS.RECEIVE_MESSAGE_TO_ALL, data);
                      })
                  
                      await AuthHistory.bulkCreate(
                        usersToLogout.map((user) => ({
                          userId: user.id,
                          type: 'logout',
                          content: 'Pomyślnie wylogowano - poprzez forceLogout',
                        }))
                      );
                  
                      await Promise.all(updatePromises);

                      socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.SUCCESS, message: 'Pomyślnie wylogowano wszystkich' });
                      logToFile(`Wylogowano ${usersToLogout.length} użytkowników`);
                  } catch (error) {
                    // console.error('Error during force logout:', error);
                    socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
                  }
            } else {
                socket.broadcast.emit(SOCKET_EVENTS.RECEIVE_MESSAGE_FROM_SERVER, data);
                // io.emit - do wszystkich włącznie z nadawcą
                // socket.broadcast.emit(SOCKET_EVENTS.RECEIVE_MESSAGE_TO_ALL, data);
                socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.SUCCESS, message: 'Pomyślnie wysłano wiadomość do wszystkich' });
            }
        } else {
            // TODO: tylko admin może wyemitować wiadomość do wszystkich. W tym miejscu dać jakiś error lub po prostu nic nie robić
            logToFile(`Nieautoryzowany emit, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ALL} | client: all | message: ${message} | type: ${data.type} | sendBy: ${currentUser.id}`);
            socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_ADMIN_PRIVILEGES_REQUIRED.code });
        }
    } else {
        // TODO: jeśli paczka nie zawiera klucza "message", to wyemitować jakiś błąd do nadawcy (socket)
        logToFile(`Brak message, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ALL} | client: all | type: ${data.type} | sendBy: ${currentUserId}`);
        socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_PROVIDE_MESSAGE_FIELD.code });
    }
}

module.exports = { messageToAll }