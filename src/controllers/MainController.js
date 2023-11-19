const { saveLogFromEndpointRequest } = require('../functions');

function mainEndpoint(req, res) {    
    // #swagger.ignore = true

    saveLogFromEndpointRequest(req)
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.send(`<p>API i socket.io działa na: ${fullUrl}</p>`);
}

module.exports = {
    mainEndpoint
};