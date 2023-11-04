const fs = require('fs');

function logToFile(message, logFileName = null) {
  const logMessage = `${getPrettyCurrentDate()} - ${message}\n`;
  var logFilePath = "logs/" + (logFileName || getLogFileName());
  
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', 'utf-8');
  }

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Błąd podczas zapisywania do pliku:', err);
    } 
  });

  console.log(logMessage)
}

function getPrettyCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function getLogFileName(date = null) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const nameFile = date ? `${date}.txt` : `${year}-${month}-${day}.txt`;
  return nameFile
}

function saveLogFromEndpointRequest(req) {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  logToFile(`run endpoint ${req.method} ${fullUrl}`);
}

module.exports = {
  logToFile, getPrettyCurrentDate, getLogFileName, saveLogFromEndpointRequest
};