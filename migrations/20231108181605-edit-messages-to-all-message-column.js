'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('messages_to_all', 'message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('messages_to_all', 'message', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};