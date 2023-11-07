const { logToFile } = require('../../src/functions');

function disconnect(socket, currentUserId, myCache) {
    logToFile(`Socket.io - Klient rozłączony - socket_id: ${socket.id}, userId: ${currentUserId}`);
    myCache.del(`connection_${socket.id}`)
}

module.exports = { disconnect }