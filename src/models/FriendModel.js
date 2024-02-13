const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./UserModel');

const Friend = sequelize.define('Friend', {
  sourceUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  timestamps: true,
  underscored: false,
  tableName: 'friends',
});

Friend.belongsTo(User, {
  foreignKey: 'sourceUserId',
  onDelete: 'CASCADE',
  as: 'sourceUser',
});

Friend.belongsTo(User, {
  foreignKey: 'targetUserId',
  onDelete: 'CASCADE',
  as: 'targetUser',
});

Friend.prototype.toJSON = function() {
  return {
    id: this.id,
    sourceUserId: this.sourceUserId,
    targetUserId: this.targetUserId,
    isAccepted: this.isAccepted,
    acceptedAt: this.acceptedAt,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
  };
};

module.exports = Friend;
