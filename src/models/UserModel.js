const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const Role = require('./RoleModel');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
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
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true, // Automatycznie dodaje updatedAt i createdAt
  underscored: false, // Ustala konwencję nazw kolumn na camelCase ; true to snake_case
  tableName: 'users', // Ustala nazwę tabeli
});

User.belongsTo(Role, { foreignKey: 'roleId' });

User.prototype.toJSON = function() {
  return { 
    id: this.id,
    email: this.email,
    userName: this.userName,
    nameLastname: this.nameLastname,
    role: this.roleId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = User;