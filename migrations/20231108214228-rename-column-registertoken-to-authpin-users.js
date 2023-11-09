'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn('users', 'registerToken', 'authPin', { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn('users', 'authPin', 'registerToken', { transaction: t });
    });
  }
};