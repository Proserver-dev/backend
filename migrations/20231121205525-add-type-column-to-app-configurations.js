'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('app_configurations', 'type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'main',
      after: 'value'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('app_configurations', 'type');
  }
};
