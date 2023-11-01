const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const { logToFile } = require('./src/functions');
const { router } = require('./src/router');
const { SETTINGS } = require('./settings');

const app = express();

app.use('/', router);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*', // Możesz dostosować '*' do odpowiednich adresów, aby ograniczyć dostęp.
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
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
});

server.listen(SETTINGS.PORT, () => {
  logToFile(`server running at port ${SETTINGS.PORT}`);
});