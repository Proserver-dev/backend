const express = require('express');
const router = express.Router();
const LogController = require('./controllers/LogController');
const MainController = require('./controllers/MainController')

// Endpoint dla strony głównej
router.get('/', MainController.mainEndpoint);

// Endpoint dla logów dla konkretnej nazwy. W większości przypadków będzie to data yyyy-mm-dd, ale niekoniecznie
router.get('/logs/:fileName', LogController.getLogs);
router.get('/logs', LogController.getLogs); // Endpoint dla logów na dzisiaj

module.exports = {
  router
};
