const { saveLogFromEndpointRequest } = require('../functions');

function mainEndpoint(req, res) {
    saveLogFromEndpointRequest(req)
    res.send(`<h1>test zmiany na ${fullUrl}</h1>`);
}

module.exports = {
    mainEndpoint
};