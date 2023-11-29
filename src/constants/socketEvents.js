const SOCKET_EVENTS = {
    SEND_AUTH_FAIL: 'authFail',

    SEND_PRIVATE_MESSAGE: 'privateMessage',
    SEND_PRIVATE_MESSAGE_CREATED_VIA_API: 'privateMessageCreatedViaAPI',
    RECEIVE_PRIVATE_MESSAGE: 'privateMessage',

    SEND_PRIVATE_MESSAGE_WRITE: 'privateMessageWrite', // kiedy zaczynasz coś pisać
    RECEIVE_PRIVATE_MESSAGE_WRITE: 'privateMessageWrite', // kiedy rozmówca zaczyna coś pisać

    SEND_MESSAGE_TO_ALL: 'messageToAll', // only admin
    SEND_MESSAGE_TO_ONE_USER: 'messageToOneUser', // only admin
    RECEIVE_MESSAGE_FROM_SERVER: 'messageFromServer',

    RECEIVE_NEW_SOCKET_CONNECTION: 'newSocketConnection', // tylko do nasłuchiwania

    SEND_CHANGE_LOCATION: 'changeLocation',
    RECEIVE_CHANGE_LOCATION: 'changeLocation'
}

module.exports = SOCKET_EVENTS