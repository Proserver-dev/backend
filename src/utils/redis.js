const redis = require('redis');
const { logToFile } = require('../functions');

const redisClient = redis.createClient();

redisClient.on('connect', () => {
    logToFile('Połączono z Redis');
});

redisClient.on('error', (err) => {
    logToFile('Błąd połączenia z Redis:', err);
});

module.exports = redisClient;