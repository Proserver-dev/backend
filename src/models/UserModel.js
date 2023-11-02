const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true // TODO pewnie będzie musiał być false
  },
  nameLastname: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  registerToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  loginToken: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true, // Automatycznie dodaje updatedAt i createdAt
  underscored: true, // Ustala konwencję nazw kolumn na snake_case
  tableName: 'users' // Ustala nazwę tabeli
});

module.exports = User;