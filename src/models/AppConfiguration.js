const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const AppConfiguration = sequelize.define('AppConfiguration', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
  underscored: false,
  tableName: 'app_configurations',
});

AppConfiguration.prototype.toJSON = function() {
  return {
    id: this.id,
    key: this.key,
    value: this.value,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = AppConfiguration;