const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      if (this.getDataValue('passwordVisible')) {
        return this.getDataValue('password');
      }
      return undefined;
    }
  },
  passwordVisible: {
    type: DataTypes.VIRTUAL, // To jest wirtualne pole
    set(value) {
      this.setDataValue('passwordVisible', value);
    }
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
  }
}, {
  timestamps: true, // Automatycznie dodaje updatedAt i createdAt
  underscored: false, // Ustala konwencję nazw kolumn na camelCase ; true to snake_case
  tableName: 'users', // Ustala nazwę tabeli
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      userName: this.userName,
      nameLastname: this.nameLastname,
      deviceToken: this.deviceToken,
      registerToken: this.registerToken,
      loginToken: this.loginToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
});

module.exports = User;