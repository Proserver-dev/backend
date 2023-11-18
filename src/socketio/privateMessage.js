const { logToFile } = require('../../src/functions');
const PrivateMessage = require('../models/PrivateMessageModel');
const SOCKET_EVENTS = require('../constants/socketEvents');
const { getSocketIdByUserId } = require('../utils/socketio');

async function privateMessage(io, socket, data, currentUserId) {

    // tutaj dodać warunki, że musi być targetUserId i że nie może być taki sam, jak sourceUserId(on będzie z tokena)
    // dodać warunek, że targetUserId musi istnieć

    logToFile(`Event: ${SOCKET_EVENTS.SEND_PRIVATE_MESSAGE} | target: ${data.targetUserId} | message: ${data.message} | source: ${currentUserId}`);

    PrivateMessage.create({ sourceUserId: currentUserId, targetUserId: data.targetUserId, message: data.message })

    const target_socket = getSocketIdByUserId(data.targetUserId)

    // TODO: to jest do przetestowania, z postmana nie miałem takiej możliwości - w adminie albo apce z dwóch kont już się uda
    if(target_socket) {
        target_socket.emit(SOCKET_EVENTS.RECEIVE_PRIVATE_MESSAGE, { sourceUserId: currentUserId, message: data.message });
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

module.exports = { privateMessage, privateMessageWrite }