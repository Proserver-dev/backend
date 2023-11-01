const fs = require('fs');
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

module.exports = {
    getLogs
};