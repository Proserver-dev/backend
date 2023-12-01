const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const EmailSendHistory = sequelize.define('EmailSendHistory', {
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  html: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  errorLog: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  timestamps: false,
  underscored: false,
  tableName: 'email_send_history',
});

EmailSendHistory.prototype.toJSON = function () {
    return {
      id: this.id,
      isRead: this.isRead,
      from: this.from,
      to: this.to,
      subject: this.subject,
      html: this.html,
      status: this.status,
      errorLog: this.errorLog,
      createdAt: this.createdAt,
    };
};

module.exports = EmailSendHistory;
