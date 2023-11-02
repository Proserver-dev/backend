const { logToFile } = require('../functions');

function mainEndpoint(req, res) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.send(`<h1>test zmiany na ${fullUrl}</h1>`);
    logToFile(`run endpoint GET ${fullUrl}`);
}

module.exports = {
    mainEndpoint
};