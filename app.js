const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const myCache = require('./src/utils/node-cache')
const { logToFile } = require('./src/functions');
const { router } = require('./src/router');
const { SETTINGS } = require('./settings');
const { mainSocket } = require('./src/socketio/Main');
const { getSocketIdByUserId } = require('./src/utils/socketio');

const app = express();
app.set("json replacer", null);

const upload = multer({ 
    dest: 'files/', // Location where files will be saved
 });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(upload.any());
app.use('/', router);

const server = http.createServer(app);
const io = socketIo(server, { cors: SETTINGS.SOCKET_IO.CORS });

// TODO: trzeba będzie lepiej zabezpieczyć ten endpoint, np przekazując token (bezpośrednio z endpointa logowania, przed wysłaniem zwrotki o pomyslnym zalogowaniu z tokenami)
app.post('/disconnect/:userId', async (req, res) => {
    const userId = req.params.userId;
    const socket = await getSocketIdByUserId(userId)

    const allData = myCache.data;
    let result = null;

    for (const key in allData) {
        if (key.startsWith("connection_")) {
            const socketId = key.replace("connection_", "");
            const userValue = allData[key].v;

            logToFile(`connected - id=${userValue} - ${socketId}`)

            if(userValue == userId) {
                result = socketId
            }
        }
    }

    logToFile(`TEST - id=${userId} - ${result}`)

    if(socket) {
        // socket.emit('messageToAll', { type: 'forceLogout' }) // ewentualnie można coś jeszcze wyemitować, żeby odłączyć stare połączenie z socketem tego usera realtime (i obsłużyć w apce)

        socket.disconnect(true)
        myCache.del(`connection_${socket}`)
        logToFile(`Socket.io - rozłączono użytkownika id=${userId} poprzez request HTTP`)
        res.status(200).json({ success: 'Rozłączono pomyślnie', userId, socket });
    } else {
        logToFile(`Socket.io - nie znaleziono aktywnego połączenia id=${userId} przy próbie rozłączenia poprzez request HTTP`)
        res.status(404).json({ error: 'Brak aktywnego połączenia dla tego użytkownika' });
    }
})

io.on('connection', (socket) => {
    mainSocket(io, socket)
});

server.listen(SETTINGS.PORT, () => {
    logToFile(`server running at port ${SETTINGS.PORT}`);
});