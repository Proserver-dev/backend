const jwt = require('jsonwebtoken');
// const redisClient = require('../utils/redis');
const myCache = require('../utils/node-cache')
const { SETTINGS } = require('../../settings');
const { logToFile } = require('../../src/functions')
const { disconnect } = require('./Disconnect')
const { message } = require('./Message')
const SOCKET_EVENTS = require('../constants/socketEvents')

function mainSocket(io, socket) {
    const token = socket.handshake.headers['token'];

    if(!token) {
        logToFile('Socket.io - Musisz przekazać Token w nagłówku');
        socket.emit(SOCKET_EVENTS.AUTH_FAIL, { error: 'Musisz przekazać Token w nagłówku' });
        return socket.disconnect(true);
    }

    try {
        const decodedToken = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });
        if (decodedToken && decodedToken.userId) {

            const userId = decodedToken.userId;
            logToFile(`Socket.io - Klient połączony - socket_id: ${socket.id}, userId: ${userId}`);
            // redisClient.hset('connections', socket.id, userId);
            myCache.set(`connection_${socket.id}`, userId)

            /// Nasłuchuj wiadomości od klienta
            socket.on('message', (data) => {
                message(io, socket, data)
            });

            /// Nasłuchuj rozłączenia klienta
            socket.on('disconnect', () => {
                disconnect(socket, userId, myCache)
            });

        } else {
            logToFile('Socket.io - Błąd uwierzytelniania - Niepoprawny token JWT');
            socket.emit(SOCKET_EVENTS.AUTH_FAIL, { error: 'Niepoprawny token JWT' });
            socket.disconnect(true);
        }
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logToFile('Socket.io - Token jest nieaktualny');
            socket.emit(SOCKET_EVENTS.AUTH_FAIL, { error: 'Token jest nieaktualny, nie udało się połączyć z serwerem' });
        } else {
            logToFile('Socket.io - Błąd weryfikacji tokenu JWT - ' + error.message);
        }
        socket.disconnect(true);
    }
}

module.exports = { mainSocket }