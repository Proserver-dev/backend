const { logToFile } = require('../../src/functions');
const PrivateMessage = require('../models/PrivateMessageModel');
const { getSocketIdByUserId } = require('../utils/socketio');
const SOCKET_EVENTS = require('../constants/socketEvents');
const API_RESULTS = require('../constants/apiResults');
const SOCKET_RESPONSES = require('../constants/socketResponses');

async function privateMessage(io, socket, data, currentUserId) {

    // tutaj dodać warunki, że musi być targetUserId i że nie może być taki sam, jak sourceUserId(on będzie z tokena)
    // dodać warunek, że targetUserId musi istnieć

    logToFile(`Event: ${SOCKET_EVENTS.SEND_PRIVATE_MESSAGE} | target: ${data.targetUserId} | message: ${data.message} | source: ${currentUserId}`);

    if(data?.targetUserId !== currentUserId) {

        const message = await PrivateMessage.create({ sourceUserId: currentUserId, targetUserId: data.targetUserId, message: data.message })
        const messageFull = await message.getFullData() // zwracamy pełny obiekt PrivateMessage (razem z pustą tablicą attachments)

        const target_socket = getSocketIdByUserId(data.targetUserId)

        // TODO: to jest do przetestowania, z postmana nie miałem takiej możliwości - w adminie albo apce z dwóch kont już się uda
        if(target_socket) {
            target_socket.emit(SOCKET_EVENTS.RECEIVE_PRIVATE_MESSAGE, messageFull);
        } else {
            // TODO: jeśli gościu nie jest połączony z socketem, to możemy spróbować wysłać push notification przez firebase
            
        }
    } else {
        // nie możesz wyemitować wiadomości do samego siebie
        logToFile(`Socket.io - Event: ${SOCKET_EVENTS.SEND_PRIVATE_MESSAGE} - proba emisji wiadomości do samego siebie. Wiadomość nie została wysłana`);
        socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_CANNOT_SEND_MESSAGE_TO_YOURSELF.code });

    }
}

async function privateMessageCreatedViaAPI(io, socket, data, currentUserId) {

    // tutaj dodać warunki, że musi być targetUserId i że nie może być taki sam, jak sourceUserId(on będzie z tokena)
    // dodać warunek, że targetUserId musi istnieć

    logToFile(`Event: ${SOCKET_EVENTS.SEND_PRIVATE_MESSAGE_CREATED_VIA_API} | target: ${data.targetUserId} | message: ${data.message} | source: ${currentUserId}`);

    if(data?.targetUserId !== currentUserId) {

        const target_socket = getSocketIdByUserId(data.targetUserId)

        // TODO: to jest do przetestowania, z postmana nie miałem takiej możliwości - w adminie albo apce z dwóch kont już się uda
        if(target_socket) {
            target_socket.emit(SOCKET_EVENTS.RECEIVE_PRIVATE_MESSAGE, data);
        } else {
            // TODO: jeśli gościu nie jest połączony z socketem, to możemy spróbować wysłać push notification przez firebase
            
        }
    } else {
        // nie możesz wyemitować wiadomości do samego siebie
        logToFile(`Socket.io - Event: ${SOCKET_EVENTS.SEND_PRIVATE_MESSAGE} - proba emisji wiadomości do samego siebie. Wiadomość nie została wysłana`);
        socket.emit(SOCKET_EVENTS.RECEIVE_RESPONSE_FROM_SOCKET, { type: SOCKET_RESPONSES.ERROR, message: API_RESULTS.ERR_CANNOT_SEND_MESSAGE_TO_YOURSELF.code });
    }
}

async function privateMessageWrite(io, socket, data, currentUserId) {

    // tutaj dodać warunki, że musi być targetUserId i że nie może być taki sam, jak sourceUserId(on będzie z tokena)
    // dodać warunek, że targetUserId musi istnieć

    logToFile(`Event: ${SOCKET_EVENTS.SEND_PRIVATE_MESSAGE_WRITE} | target: ${data.targetUserId} | source: ${currentUserId}`);

    const target_socket = getSocketIdByUserId(data.targetUserId)

    // TODO: to jest do przetestowania, z postmana nie miałem takiej możliwości - w adminie albo apce z dwóch kont już się uda
    if(target_socket) {
        target_socket.emit(SOCKET_EVENTS.RECEIVE_PRIVATE_MESSAGE_WRITE, { sourceUserId: currentUserId, isWritting: true });
    }
}

module.exports = { privateMessage, privateMessageCreatedViaAPI, privateMessageWrite }