'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'lastEmailSentTime', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      after: 'loginToken',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'lastEmailSentTime');
  },
};