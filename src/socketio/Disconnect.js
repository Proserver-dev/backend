const { logToFile } = require('../../src/functions');

function disconnect(socket, currentUserId, myCache) {
    socket.broadcast.emit(SOCKET_EVENTS.RECEIVE_CONNECTION_ACTION, { action: 'disconnected', userId: currentUserId })
    logToFile(`Socket.io - Klient rozłączony - socket_id: ${socket.id}, userId: ${currentUserId}`);
    myCache.del(`connection_${socket.id}`)
}

module.exports = { disconnect }