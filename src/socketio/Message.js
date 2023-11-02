const { logToFile } = require('../../src/functions');

function message(io, socket, data) {
    logToFile(`Otrzymano wiadomość: client: ${data.client} , message: ${data.message}`); // data - to jest JSON
    
    console.log(data)
    // logToFile(`Otrzymano wiadomość: ${JSON.stringify(data)}`);

    // Przesyłaj wiadomość z powrotem do klienta
    // socket.emit('message', `Odpowiedź: ${data}`);

    // Przesyłaj wiadomość do wszystkich klientów
    io.emit('message', data);   
}

module.exports = { message }