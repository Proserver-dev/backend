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
const API_RESULTS = require('./src/constants/apiResults');

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

app.use((err, req, res, next) => {
    logToFile(`Błąd serwerowy - ${API_RESULTS.ERR_SOMETHING_WENT_WRONG.code}`)
    res.status(API_RESULTS.ERR_SOMETHING_WENT_WRONG.status_code).send({ error: API_RESULTS.ERR_SOMETHING_WENT_WRONG.code, err });
});

const server = http.createServer(app);
const io = socketIo(server, { cors: SETTINGS.SOCKET_IO.CORS });

io.on('connection', (socket) => {
    mainSocket(io, socket)
});

server.listen(SETTINGS.PORT, () => {
    logToFile(`server running at port ${SETTINGS.PORT}`);
});