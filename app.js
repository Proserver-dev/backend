const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const { logToFile } = require('./src/functions');
const { router } = require('./src/router');
const { SETTINGS } = require('./settings');
const { mainSocket } = require('./src/socketio/Main');

const app = express();
app.use('/', router);

const server = http.createServer(app);
const io = socketIo(server, { cors: SETTINGS.SOCKET_IO.CORS });

io.on('connection', (socket) => {
    mainSocket(io, socket)
});

server.listen(SETTINGS.PORT, () => {
    logToFile(`server running at port ${SETTINGS.PORT}`);
});