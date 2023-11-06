'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('roles', [
      {
        name: 'Administrator',
        short: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User',
        short: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Blocked',
        short: 'blocked',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('roles', {
      [Sequelize.Op.or]: [
        { name: 'Administrator' },
        { name: 'User' },
        { name: 'Blocked' },
      ],
    });
  },
};