const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const PrivateMessage = sequelize.define('PrivateMessage', {
  sourceUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: true,
  underscored: false,
  tableName: 'private_messages',
});

PrivateMessage.prototype.toJSON = function() {
  return {
    id: this.id,
    sourceUserId: this.sourceUserId,
    targetUserId: this.targetUserId,
    message: this.message,
    isRead: this.isRead,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
  };
};

module.exports = PrivateMessage;