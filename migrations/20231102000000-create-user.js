'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: true // TODO pewnie będzie musiał być false
      },
      nameLastname: {
        type: Sequelize.STRING,
        allowNull: true
      },
      deviceToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      registerToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      loginToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users');
  }
};
