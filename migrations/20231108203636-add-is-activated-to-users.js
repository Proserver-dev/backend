'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'isActivated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'roleId',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'isActivated');
  }
};