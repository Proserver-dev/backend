const { Sequelize } = require('sequelize');
const { logToFile } = require('../../src/functions');
const MessageToAll = require('../models/MessageToAllModel');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const AuthHistory = require('../models/AuthHistory')
const { getSocketIdByUserId } = require('../utils/socketio');
const SOCKET_EVENTS = require('../constants/socketEvents');
const API_RESULTS = require('../constants/apiResults');
const SOCKET_RESPONSES = require('../constants/socketResponses');

async function messageToOneUser(io, socket, data, currentUserId) {
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
        if(data.targetUserId) {
            // TODO: to trochę spowalnia emisję, ale to sprawdzenie musi być, żeby tylko admin mógł taką emisję zrobić
            const currentUser = await User.findByPk(currentUserId);
            const role = await Role.findByPk(currentUser.roleId); // admin role
            if(role.short === "admin") {
                logToFile(`Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ONE_USER} | target: ${data.targetUserId} | message: ${data.message} | type: ${data.type} | sendBy: ${currentUser.id}`);
                MessageToAll.create({ sendBy: currentUser.id, message: `${data.message} | only user_id=${data.targetUserId}`, type: data.type })

                const target_socket = getSocketIdByUserId(data.targetUserId)

                // TODO: to jest do przetestowania, z postmana nie miałem takiej możliwości - w adminie albo apce z dwóch kont już się uda
                if(target_socket) {
                    target_socket.emit(SOCKET_EVENTS.RECEIVE_MESSAGE_TO_ALL, { type: data.type, message: data.message });
                } else {
                    // TODO: jeśli gościu nie jest połączony z socketem, to możemy spróbować wysłać push notification przez firebase
                    
                }

                if(data.type == "forceLogout") {
                    try {
                        const user = await User.findByPk(data.targetUserId)
                        await user.update({ loginToken: null })
                        await AuthHistory.create({ 
                            userId: user.id,
                            type: 'logout',
                            content: 'Pomyślnie wylogowano - poprzez forceLogout' 
                        })
                    
                        logToFile(`Wylogowano użytkownika id=${user.id} email=${user.email}`);
                        socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.SUCCESS, message: `Pomyślnie wylogowano użytkownika id=${data?.targetUserId}` });
                    } catch (error) {
                        // console.error('Error during force logout:', error);
                        socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
                    }
                } else {
                    socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.SUCCESS, message: `Pomyślnie wysłano wiadomość do użytkownika id=${data?.targetUserId}` });
                }
            } else {
                // TODO: tylko admin może wyemitować wiadomość do wszystkich. W tym miejscu dać jakiś error lub po prostu nic nie robić
                logToFile(`Nieautoryzowany emit, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ONE_USER} | message: ${message} | type: ${data.type} | sendBy: ${currentUser.id}`);
                socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_ADMIN_PRIVILEGES_REQUIRED.code });
            }
        } else {
            // nie przekazano targetUserId w paczce "data" - nie wiadomo do kogo wemitować wiadomość
            logToFile(`Brak targetUserId, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ONE_USER} | type: ${data.type} | sendBy: ${currentUserId}`);
            socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }
    } else {
        // TODO: jeśli paczka nie zawiera klucza "message", to wyemitować jakiś błąd do nadawcy (socket)
        logToFile(`Brak message, nie wyemitowano - Event: ${SOCKET_EVENTS.SEND_MESSAGE_TO_ONE_USER} | type: ${data.type} | sendBy: ${currentUserId}`);
        socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_PROVIDE_MESSAGE_FIELD.code });
    }
}

module.exports = { messageToOneUser }