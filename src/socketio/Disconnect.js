const { logToFile } = require('../../src/functions');

function disconnect(socket, userId, myCache) {
    logToFile(`Socket.io - Klient rozłączony - socket_id: ${socket.id}, userId: ${userId}`);
    // redisClient.hdel('connections', socket.id)
    myCache.del(`connection_${socket.id}`)
}

module.exports = { disconnect }