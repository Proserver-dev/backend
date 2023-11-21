'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('email_send_history', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      isRead: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      from: {
        type: Sequelize.STRING,
        allowNull: false
      },
      to: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      html: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      errorLog: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      timestamps: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_send_history');
  }
};
