const redisClient = require('../utils/redis');
const { logToFile } = require('../../src/functions');

function disconnect(socket, userId) {
    redisClient.hdel('connections', socket.id, (err) => {
        if (err) {
            console.error('Socket.io - Błąd kasowania socket.id w Redis:', err);
            logToFile('Socket.io - Błąd kasowania socket.id w Redis');
        } else {
            logToFile(`Socket.io - Klient rozłączony - socket_id: ${socket.id}, userId: ${userId}`);
        }
    });
}

module.exports = { disconnect }