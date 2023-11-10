const myCache = require('./node-cache')

function getSocketIdByUserId(user_id) {
    const allData = myCache.data;
    let result = null;

    for (const key in allData) {
        if (key.startsWith("connection_")) {
            const socketId = key.replace("connection_", "");
            const userValue = allData[key].v;

            if(userValue == user_id) {
                result = socketId
            }
        }
    }

    return result
}

function getUserIdBySocketId(socket_id) {
    let result = null
    const user_id = myCache.get(`connection_${socket_id}`)

    if(user_id != undefined)
        result = user_id

    return result
}

module.exports = {
    getSocketIdByUserId, getUserIdBySocketId
};