const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./UserModel')

  const MessageToAll = sequelize.define('MessageToAll', {
    sendBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    timestamps: false,
    underscored: false,
    tableName: 'messages_to_all',
  });

MessageToAll.belongsTo(User, { foreignKey: 'sendBy' });

MessageToAll.prototype.toJSON = function() {
  return { 
    id: this.id,
    sendBy: this.sendBy,
    message: this.message,
    type: this.type,
    createdAt: this.createdAt,
  };
};

module.exports = MessageToAll;
