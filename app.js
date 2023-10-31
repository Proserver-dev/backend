// const fetch = require('node-fetch');
const express = require('express');
const http = require('http');
const fs = require('fs');
const { logToFile } = require('./src/functions');
const { router } = require('./src/routes');
const socketIo = require('socket.io');

const app = express();
const port = 3000;

app.use('/', router);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*', // Możesz dostosować '*' do odpowiednich adresów, aby ograniczyć dostęp.
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  // console.log('Klient połączony');
  // const socketString = JSON.stringify(socket)
  // logToFile('logs/log.txt', `Klient połączony - ${socketString}`);
  // logToFile('logs/log.txt', `Klient połączony - ${JSON.stringify(socket)}`);
  logToFile('logs/log.txt', `Klient połączony - socket_id: ${socket.id}`);

  // Nasłuchuj wiadomości od klienta
  socket.on('message', (data) => {
    // console.log(`Otrzymano wiadomość: ${data}`);
    logToFile('logs/log.txt', `Otrzymano wiadomość: client: ${data.client} , message: ${data.message}`); // data - to jest JSON
    // logToFile('logs/log.txt', `Otrzymano wiadomość: ${JSON.stringify(data)}`);

    // Przesyłaj wiadomość z powrotem do klienta
    // socket.emit('message', `Odpowiedź: ${data}`);

    // Przesyłaj wiadomość do wszystkich klientów
    io.emit('message', data);
  });

  // Nasłuchuj rozłączenia klienta
  socket.on('disconnect', () => {
    // console.log('Klient rozłączony');
    logToFile('logs/log.txt', `Klient rozłączony - socket_id: ${socket.id}`);
  });
});

server.listen(port, () => {
  logToFile('logs/log.txt', `server running at port ${port}`);
});