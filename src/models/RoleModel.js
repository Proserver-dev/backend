const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  short: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  }
}, {
  timestamps: true, // Automatycznie dodaje updatedAt i createdAt
  underscored: false, // Ustala konwencję nazw kolumn na camelCase ; true to snake_case
  tableName: 'roles', // Ustala nazwę tabeli
});

Role.prototype.toJSON = function() {
  return { 
    id: this.id,
    name: this.name,
    short: this.short,
    // createdAt: this.createdAt,
    // updatedAt: this.updatedAt
  };
};

module.exports = Role;