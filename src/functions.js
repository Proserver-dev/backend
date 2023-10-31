const fs = require('fs');

function logToFile(logFilePath, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', 'utf-8');
  }

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Błąd podczas zapisywania do pliku:', err);
    } else {
      console.log(logMessage);
    }
  });

  console.log(logMessage)
}

module.exports = {
  logToFile,
};