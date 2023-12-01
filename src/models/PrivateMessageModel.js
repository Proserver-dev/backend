const { Sequelize, DataTypes } = require('sequelize');
const PrivateMessageAttachment = require('./PrivateMessageAttachmentModel')
const sequelize = require('../utils/db');
const User = require('../models/UserModel')

const PrivateMessage = sequelize.define('PrivateMessage', {
  sourceUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
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

PrivateMessage.hasMany(PrivateMessageAttachment, {
  foreignKey: 'privateMessageId',
  as: 'attachments',
});

PrivateMessage.belongsTo(User, {
  foreignKey: 'sourceUserId',
  onDelete: 'CASCADE',
})

PrivateMessage.belongsTo(User, {
  foreignKey: 'targetUserId',
  onDelete: 'CASCADE',
})

PrivateMessage.prototype.toJSON = function() {
  return {
    id: this.id,
    sourceUserId: parseInt(this.sourceUserId),
    targetUserId: parseInt(this.targetUserId),
    message: this.message,
    isRead: this.isRead,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
  };
};

PrivateMessage.prototype.getFullData = async function () {
  const messageData = this.toJSON();
  messageData.attachments = await this.getAttachments();
  return messageData;
};

module.exports = PrivateMessage;