const SOCKET_EVENTS = {
    SEND_AUTH_FAIL: 'authFail',

    SEND_PRIVATE_MESSAGE: 'privateMessage',
    RECEIVE_PRIVATE_MESSAGE: 'privateMessage',
    SEND_PRIVATE_MESSAGE_WRITE: 'privateMessageWrite', // kiedy zaczynasz coś pisać
    RECEIVE_PRIVATE_MESSAGE_WRITE: 'privateMessageWrite', // kiedy rozmówca zaczyna coś pisać

    SEND_MESSAGE_TO_ALL: 'messageToAll',
    RECEIVE_MESSAGE_TO_ALL: 'messageToAll',

    NEW_SOCKET_CONNECTION: 'newSocketConnection'
}

module.exports = SOCKET_EVENTS