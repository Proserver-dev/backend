const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const PrivateMessageAttachment = sequelize.define('PrivateMessageAttachment', {
  privateMessageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'image',
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  timestamps: false,
  underscored: false,
  tableName: 'private_messages_attachments',
});

PrivateMessageAttachment.prototype.toJSON = function() {
  return {
    // id: this.id,
    // privateMessageId: this.privateMessageId,
    url: this.url,
    type: this.type,
    // createdAt: this.createdAt,
  };
};

module.exports = PrivateMessageAttachment;