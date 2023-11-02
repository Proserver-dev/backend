const { Sequelize } = require('sequelize')
const dbConfig = require('../../config/db_mysql.json')
const { SETTINGS } = require('../../settings')

const env = SETTINGS.ENV
const config = dbConfig[env];

const sequelize = new Sequelize({
    dialect: config.dialect,
    host: config.host,
    username: config.username,
    password: config.password,
    database: config.database,
});

module.exports = sequelize;