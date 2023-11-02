const { logToFile } = require('../../src/functions')
const { disconnect } = require('./Disconnect')
const { message } = require('./Message')

function mainSocket(io, socket) {
    // const socketString = JSON.stringify(socket)
    // logToFile(`Klient połączony - ${socketString}`);
    // logToFile(`Klient połączony - ${JSON.stringify(socket)}`);
    logToFile(`Klient połączony - socket_id: ${socket.id}`);

    // console.log("---- SOCKET -----")
    // console.log(socket)

    if(socket.handshake.headers['ngrok-skip-browser-warning'] != undefined) {
        console.log("----- ngrok-skip-browser-warning ----")
        console.log(socket.handshake.headers['ngrok-skip-browser-warning'])
    }

    // Nasłuchuj wiadomości od klienta
    socket.on('message', (data) => {
        message(io, socket, data)
    });

    // Nasłuchuj rozłączenia klienta
    socket.on('disconnect', () => {
        disconnect(socket)
    });
}

module.exports = { mainSocket }