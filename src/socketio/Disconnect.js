const { logToFile } = require('../../src/functions');

function disconnect(socket) {
    logToFile(`Klient rozłączony - socket_id: ${socket.id}`);
}

module.exports = { disconnect }