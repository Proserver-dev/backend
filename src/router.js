const express = require('express');
const router = express.Router();
const LogController = require('./controllers/LogController');
const MainController = require('./controllers/MainController')


router.get('/', MainController.mainEndpoint);
router.get('/logs/:fileName', LogController.getLogs);
router.get('/logs', LogController.getLogs);

module.exports = { router };
