const Redis = require('ioredis');

const redisClient = new Redis({
    enableOfflineQueue: true,
    lazyConnect: true
});

module.exports = redisClient;