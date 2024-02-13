'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('friends', 'acceptedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      after: 'isAccepted'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('friends', 'acceptedAt');
  }
};
