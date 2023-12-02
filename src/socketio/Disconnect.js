const { logToFile } = require('../../src/functions');
const SOCKET_EVENTS = require('../constants/socketEvents');
const User = require('../models/UserModel');

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function disconnect(socket, currentUserId, myCache) {
    await delay(1000);
    const user = await User.findByPk(currentUserId)
    const isLoggedIn = user.loginToken !== null // czasami przy rozłączeniu z tokenem user może być dalej zalogowany i posiadać ważny token
    socket.broadcast.emit(SOCKET_EVENTS.RECEIVE_CONNECTION_ACTION, { 
        action: 'disconnected', 
        userId: currentUserId, 
        isLoggedIn: isLoggedIn, 
        socketId: null 
    })
    logToFile(`Socket.io - Klient rozłączony - socket_id: ${socket.id}, userId: ${currentUserId}`);
    myCache.del(`connection_${socket.id}`)
}

module.exports = { disconnect }