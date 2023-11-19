const { Sequelize, DataTypes } = require('sequelize');
const PrivateMessageAttachment = require('./PrivateMessageAttachmentModel')
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