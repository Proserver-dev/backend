const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const swaggerDefinitions = require('./swagger/swaggerDefinitions')

const myCache = require('./src/utils/node-cache')
const { logToFile } = require('./src/functions');
const { router } = require('./src/router');
const { SETTINGS } = require('./settings');
const { mainSocket } = require('./src/socketio/Main');
const { getSocketIdByUserId } = require('./src/utils/socketio');
const API_RESULTS = require('./src/constants/apiResults');

const app = express();
app.set("json replacer", null);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const { uploadAttachments, handleMulterErrors } = require('./src/utils/multer');
const UPLOAD_PATHS = require('./src/constants/uploadPaths');
app.use(uploadAttachments.array('attachments'));
app.use('/'+UPLOAD_PATHS.PRIVATE_MESSAGES_ATTACHMENTS, express.static(path.join(__dirname, UPLOAD_PATHS.PRIVATE_MESSAGES_ATTACHMENTS)))
app.use(handleMulterErrors);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinitions));
app.use('/', router);

app.use((err, req, res, next) => {
    logToFile(`Błąd serwerowy - ${API_RESULTS.ERR_SOMETHING_WENT_WRONG.code}`)
    console.log(err)
    res.status(API_RESULTS.ERR_SOMETHING_WENT_WRONG.status_code).send({ error: API_RESULTS.ERR_SOMETHING_WENT_WRONG.code, err });
});

const allTransports = [
    'websocket',
    'polling',
    'polling-xhr',
    'polling-jsonp',
    'flashsocket',
    'htmlfile',
    'xhr-polling',
    'xhr-multipart',
    'xhr-streaming',
    'jsonp-polling',
];

const server = http.createServer(app);
// ors: SETTINGS.SOCKET_IO.CORS,
const io = socketIo(server, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'POST', 'DELETE'],
        credentials: true,
        allowedHeaders: ['*']
    },
    allowRequest: (req, callback) => {
        const isAllowed = true;
        callback(null, isAllowed);
    },
    transports: allTransports,
    allowUpgrades: true,
    allowEIO3: true,
    maxHttpBufferSize: 1e8
});

io.on('connection', (socket) => {
    mainSocket(io, socket)
});

server.listen(SETTINGS.PORT, () => {
    logToFile(`server running at port ${SETTINGS.PORT}`);
});