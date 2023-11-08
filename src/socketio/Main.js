const jwt = require('jsonwebtoken');
const myCache = require('../utils/node-cache')
const { SETTINGS } = require('../../settings');
const { logToFile } = require('../../src/functions')
const { disconnect } = require('./Disconnect')
const SOCKET_EVENTS = require('../constants/socketEvents');
const { messageToAll } = require('./messageToAll');
const { getSocketIdByUserId } = require('../utils/socketio')

async function mainSocket(io, socket) {
    const token = socket.handshake.headers['token'];

    if(!token) {
        logToFile('Socket.io - Musisz przekazać Token w nagłówku');
        socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: 'Musisz przekazać Token w nagłówku' });
        return socket.disconnect(true);
    }

    try {
        const decodedToken = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });
        if (!decodedToken || !decodedToken.userId) {
            logToFile('Socket.io - Błąd uwierzytelniania - Niepoprawny token JWT');
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: 'Niepoprawny token JWT' });
            return socket.disconnect(true);
        }

        const currentUserId = decodedToken.userId;

        if(getSocketIdByUserId(currentUserId)) {
            logToFile(`Socket.io - Użytkownik id:${currentUserId} jest już połączony z socketem. Kolejne połączenie zostało odrzucone`);
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: 'Jesteś już połączony z socketem' });
            return socket.disconnect(true);
        }

        logToFile(`Socket.io - Klient połączony - socket_id: ${socket.id}, userId: ${currentUserId}`);
        myCache.set(`connection_${socket.id}`, currentUserId)

        // TODO: jeśli admin, to tutaj można przypisać socket do "room" dla adminów
        // socket.join("admins");

        socket.on(SOCKET_EVENTS.SEND_MESSAGE_TO_ALL, (data) => { messageToAll(io, socket, data, currentUserId) })

        socket.on('disconnect', () => { disconnect(socket, currentUserId, myCache) });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logToFile('Socket.io - Token jest nieaktualny');
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: 'Token jest nieaktualny, nie udało się połączyć z serwerem' });
        } else {
            logToFile('Socket.io - Błąd weryfikacji tokenu JWT - ' + error.message);
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: 'Błąd weryfikacji tokenu JWT, nie udało się połączyć z serwerem' });
        }
        socket.disconnect(true);
    }
}

module.exports = { mainSocket }