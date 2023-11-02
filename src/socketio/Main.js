const { logToFile } = require('../../src/functions');

function mainSocket(socket, io) {
    // const socketString = JSON.stringify(socket)
    // logToFile(`Klient połączony - ${socketString}`);
    // logToFile(`Klient połączony - ${JSON.stringify(socket)}`);
    logToFile(`Klient połączony - socket_id: ${socket.id}`);

    // Nasłuchuj wiadomości od klienta
    socket.on('message', (data) => {
        logToFile(`Otrzymano wiadomość: client: ${data.client} , message: ${data.message}`); // data - to jest JSON
        // logToFile(`Otrzymano wiadomość: ${JSON.stringify(data)}`);

        // Przesyłaj wiadomość z powrotem do klienta
        // socket.emit('message', `Odpowiedź: ${data}`);

        // Przesyłaj wiadomość do wszystkich klientów
        io.emit('message', data);
    });

    // Nasłuchuj rozłączenia klienta
    socket.on('disconnect', () => {
        logToFile(`Klient rozłączony - socket_id: ${socket.id}`);
    });
}

module.exports = { mainSocket }