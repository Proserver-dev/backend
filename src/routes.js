const express = require('express');
const router = express.Router();
const fs = require('fs');
const { logToFile } = require('./functions');

// Endpoint dla strony głównej
router.get('/', (req, res) => {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.send('<h1>test zmiany na backend.proserver.dev</h1>');
  logToFile('logs/log.txt', `run endpoint GET ${fullUrl}`);
});

// Endpoint dla logów
router.get('/logs', (req, res) => {
  fs.readFile('logs/log.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Błąd odczytu pliku log.txt:', err);
      res.status(500).send('Błąd odczytu pliku log.txt');
    } else {
      const logLines = data.split('\n').map((line) => {
        const parts = line.split(' - ');
        if (parts.length === 2) {
          const timestamp = new Date(parts[0]).toLocaleString();
          const message = parts[1];
          return `${timestamp} - ${message}`;
        }
        return line;
      });
      res.send('<pre>' + logLines.join('\n') + '</pre>');
    }
  });
});

module.exports = {
  router
};
