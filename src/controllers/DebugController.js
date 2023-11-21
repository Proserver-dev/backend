const fs = require('fs');
const myCache = require('../utils/node-cache')
const { getLogFileName } = require('../functions');
const { saveLogFromEndpointRequest } = require('../functions');
const API_RESULTS = require('../constants/apiResults')
const User = require('../models/UserModel');
const Role = require('../models/RoleModel')

function getLogs(req, res) {
    // #swagger.ignore = true

    let fileName = getLogFileName();

    if(req.params.fileName != null)
        fileName = req.params.fileName + ".txt";

    let result = "";
    result = result.concat('<h1>' + fileName + '</h1>');
    fs.readFile(`logs/${fileName}`, 'utf8', (err, data) => {
      if (err) {
        console.error(`Błąd odczytu pliku ${fileName} : `, err);
        res.status(API_RESULTS.ERR_READ_FILE.status_code).json({ error: API_RESULTS.ERR_READ_FILE.code, file: fileName });
      } else {
        const lines = data.split('\n').reverse();
        const reversedData = lines.join('\n');
        result = result.concat(`<pre>${reversedData}</pre>`);
        res.send(result)
      }
    });
}

async function getSocketConnections(req, res) {
  // #swagger.tags = ['Debug']

  saveLogFromEndpointRequest(req)
  const allData = myCache.data;
  const dataArray = [];

  for (const key in allData) {
      if (key.startsWith("connection_")) {
          const socketId = key.replace("connection_", "");
          const userId = allData[key].v;
          const user = await User.findByPk(userId);
          const role = await Role.findByPk(user.roleId)
          user.roleId = role
          dataArray.push({ socket_id: socketId, userId, user });
      }
  }

  res.json(dataArray);
}

function getAllApiResultsConstants(req, res) {
  // #swagger.tags = ['Debug']
  
  saveLogFromEndpointRequest(req)
  res.json(API_RESULTS)
}

module.exports = {
    getLogs, getSocketConnections, getAllApiResultsConstants
};