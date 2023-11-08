const { Sequelize } = require('sequelize');
const { logToFile } = require('../../src/functions');
const SOCKET_EVENTS = require('../constants/socketEvents');
const MessageToAll = require('../models/MessageToAllModel');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');

async function messageToAll(io, socket, data, currentUserId) {
    const { message, type } = data

    if(!type) {
        data = {
            ...data,
            type: 'info'
        }
    }

    if(message) {
        // TODO: to trochę spowalnia emisję, ale to sprawdzenie musi być, żeby tylko admin mógł taką emisję zrobić
        const currentUser = await User.findByPk(currentUserId);
        const role = await Role.findByPk(currentUser.roleId); // admin role
        if(role.short === "admin") {
            logToFile(`Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ALL} | client: all | message: ${message} | type: ${data.type} | sendBy: ${currentUser.id}`);
            MessageToAll.create({ sendBy: currentUser.id, message, type: data.type })
            if(data.type == "forceLogout") {
                // wszyscy użytkownikcy, których roleId jest różne od role.id admina i loginToken jest różny od null
                const [updatedCount, updatedUsers] = await User.update(
                    { loginToken: null },
                    { 
                        where: { 
                            roleId: { [Sequelize.Op.ne]: role.id },
                            loginToken: { [Sequelize.Op.ne]: null }
                        } 
                    }
                );
                logToFile(`Wylogowano ${updatedCount} użytkowników`)
            }

            io.emit(SOCKET_EVENTS.RECEIVE_MESSAGE_TO_ALL, data);
            // socket.broadcast.emit(SOCKET_EVENTS.RECEIVE_MESSAGE_TO_ALL, data);

        } else {
            // TODO: tylko admin może wyemitować wiadomość do wszystkich. W tym miejscu dać jakiś error lub po prostu nic nie robić
            logToFile(`Nieautoryzowany emit, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ALL} | client: all | message: ${message} | type: ${data.type} | sendBy: ${currentUser.id}`);
        }
    } else {
        // TODO: jeśli paczka nie zawiera klucza "message", to wyemitować jakiś błąd do nadawcy (socket)
        logToFile(`Brak message, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ALL} | client: all | type: ${data.type} | sendBy: ${currentUser.id}`);
    }
}

module.exports = { messageToAll }