'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Dodawanie kaskadowych operacji kasowania i aktualizowania do kolumn sourceUserId i targetUserId
    await queryInterface.changeColumn('private_messages', 'sourceUserId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE', // Kaskadowe kasowanie
      onUpdate: 'CASCADE' // Kaskadowa aktualizacja
    });

    await queryInterface.changeColumn('private_messages', 'targetUserId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE', // Kaskadowe kasowanie
      onUpdate: 'CASCADE' // Kaskadowa aktualizacja
    });
  },

  down: async (queryInterface, Sequelize) => {
    // W przypadku cofnięcia migracji nie ma potrzeby zmian w kolumnach, więc można pozostawić puste
  }
};
