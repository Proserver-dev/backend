'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'roleId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      after: 'id', // po której istniejącej kolumnie ma zostać dodana nowa
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'roleId');
  },
};