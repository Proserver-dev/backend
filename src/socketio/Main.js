const jwt = require('jsonwebtoken');
const myCache = require('../utils/node-cache')
const { SETTINGS } = require('../../settings');
const { logToFile } = require('../../src/functions')
const { disconnect } = require('./Disconnect')
const SOCKET_EVENTS = require('../constants/socketEvents');
const { messageToAll } = require('./messageToAll');
const { privateMessage, privateMessageCreatedViaAPI, privateMessageWrite } = require('./privateMessage')
const { getSocketIdByUserId } = require('../utils/socketio');
const HEADERS_KEYS = require('../constants/headersKeys');
const getAppSetting = require('../utils/getAppSetting')
const APP_CONFIGURATION_DEFAULT = require('../constants/appConfigurationDefault')
const API_RESULTS = require('../constants/apiResults')

async function mainSocket(io, socket) {
    const token = socket.handshake.headers[HEADERS_KEYS.LOGIN_TOKEN.toLowerCase()];

    logToFile(`Socket.io - próba połączenia usera z socketem...`)

    const isLoginEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key)
    if(!isLoginEnabled) {
        logToFile(`Socket.io - próba połączenia, ale logowanie jest wyłączone`)
        const reason = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key)
        socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: API_RESULTS.ERR_LOGIN_DISABLED.code, reason });
        return socket.disconnect(true);
    }

    if(!token) {
        logToFile(`Socket.io - próba połączenia, ale musisz przekazać Token w nagłówku`)
        socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.code });
        return socket.disconnect(true);
    }

    try {
        const decodedToken = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });
        if (!decodedToken || !decodedToken.userId) {
            logToFile('Socket.io - Błąd uwierzytelniania - Niepoprawny token JWT');
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: API_RESULTS.ERR_VERIFY_TOKEN.code });
            return socket.disconnect(true);
        }

        const currentUserId = decodedToken.userId;

        const checkConnectedSocket = getSocketIdByUserId(currentUserId)
        if(checkConnectedSocket) {
            // logToFile(`Socket.io - Użytkownik id:${currentUserId} jest już połączony z socketem. Kolejne połączenie zostało odrzucone`);
            // socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: 'Jesteś już połączony z socketem' });
            // return socket.disconnect(true);

            logToFile(`Socket.io - Użytkownik id:${currentUserId} był już połączony z socketem. Stare połączenie zostało zerwane`);
            const oldSocket = Array.from(io.sockets.sockets.values()).find(s => s.id === checkConnectedSocket);
            if(oldSocket) {
                oldSocket.emit(SOCKET_EVENTS.NEW_SOCKET_CONNECTION, { logout: true })
                oldSocket.disconnect(true)
            }
            myCache.del(`connection_${checkConnectedSocket}`)
        }

        logToFile(`Socket.io - Klient połączony - socket_id: ${socket.id}, userId: ${currentUserId}`);
        myCache.set(`connection_${socket.id}`, currentUserId)

        // TODO: jeśli admin, to tutaj można przypisać socket do "room" dla adminów
        // socket.join("admins");

        socket.on(SOCKET_EVENTS.SEND_MESSAGE_TO_ALL, (data) => { messageToAll(io, socket, data, currentUserId) })
        socket.on(SOCKET_EVENTS.SEND_PRIVATE_MESSAGE, (data) => { privateMessage(io, socket, data, currentUserId) })
        socket.on(SOCKET_EVENTS.SEND_PRIVATE_MESSAGE_CREATED_VIA_API, (data) => { privateMessageCreatedViaAPI(io, socket, data, currentUserId) })
        socket.on(SOCKET_EVENTS.SEND_PRIVATE_MESSAGE_WRITE, (data) => { privateMessageWrite(io, socket, data, currentUserId) })

        socket.on('disconnect', () => { disconnect(socket, currentUserId, myCache) });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logToFile('Socket.io - Token jest nieaktualny');
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: API_RESULTS.ERR_TOKEN_EXPIRED.code });
        } else {
            logToFile('Socket.io - Błąd weryfikacji tokenu JWT - ' + error.message);
            socket.emit(SOCKET_EVENTS.SEND_AUTH_FAIL, { error: API_RESULTS.ERR_VERIFY_TOKEN.code });
        }
        socket.disconnect(true);
    }
}

module.exports = { mainSocket }