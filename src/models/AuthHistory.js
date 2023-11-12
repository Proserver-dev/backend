const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./UserModel'); // Zaimportuj model User

const AuthHistory = sequelize.define('AuthHistory', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
    timestamps: false,
    underscored: false,
    tableName: 'auth_history',
  });

AuthHistory.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

AuthHistory.prototype.toJSON = function () {
  return {
    id: this.id,
    userId: this.userId,
    type: this.type,
    content: this.content,
    createdAt: this.createdAt,
  };
};

module.exports = AuthHistory;