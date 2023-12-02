const { logToFile } = require('../../src/functions');
const SOCKET_EVENTS = require('../constants/socketEvents');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');

async function changeLocation(io, socket, data, currentUserId) {
    logToFile(`Event: ${SOCKET_EVENTS.SEND_CHANGE_LOCATION} | latitude: ${data.latitude} | longitude: ${data.longitude} | source: ${currentUserId}`);

    const user = await User.findByPk(currentUserId)
    user.roleId = await Role.findByPk(user.roleId)
    data.user = user

    // TODO: tutaj zapisywanie zmienionej lokalizacji użytkownika do bazy danych np do mongoDB
    // TODO: tutaj w data oczekujemy też klucza "user" z pełnym obiektem usera. Do sprawdzenia czy to będzie dobre - czy może lepiej tego klucza w ogóle nie przekazywać i wyciągać obiekt usera na podstawie "currentUserId" i dopiero dodawać go do paczki "data" przed emisją do wszystkich

    // emisja do wszystkich z wyjątkiem nadawcy
    socket.broadcast.emit(SOCKET_EVENTS.RECEIVE_CHANGE_LOCATION, data);
}

module.exports = { changeLocation }