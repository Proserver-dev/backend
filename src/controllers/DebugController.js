const fs = require('fs');
const myCache = require('../utils/node-cache')
const { getLogFileName } = require('../functions');

function getLogs(req, res) {
    let fileName = getLogFileName();

    if(req.params.fileName != null)
        fileName = req.params.fileName + ".txt";

    let result = "";
    result = result.concat('<h1>' + fileName + '</h1>');
    fs.readFile(`logs/${fileName}`, 'utf8', (err, data) => {
      if (err) {
        console.error(`Błąd odczytu pliku ${fileName} : `, err);
        res.status(500).send(`Błąd odczytu pliku ${fileName}`);
      } else {
        result = result.concat(`<pre>${data}</pre>`);
        res.send(result)
      }
    });
}

function getSocketConnections(req, res) {
  const allData = myCache.data;
  const dataArray = [];

  for (const key in allData) {
      if (key.startsWith("connection_")) {
          const socketId = key.replace("connection_", "");
          const userValue = allData[key].v;

          dataArray.push({ socket_id: socketId, user_id: userValue });
      }
  }

  res.json(dataArray);
}

module.exports = {
    getLogs, getSocketConnections
};