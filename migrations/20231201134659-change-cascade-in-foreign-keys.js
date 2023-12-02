'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('private_messages_attachments', 'privateMessageId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'private_messages',
        key: 'id',
        onDelete: 'CASCADE', // Kaskadowe kasowanie
        onUpdate: 'CASCADE' // Kaskadowa aktualizacja
      },
    });

    await queryInterface.changeColumn('auth_history', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
        onDelete: 'CASCADE', // Kaskadowe kasowanie
        onUpdate: 'CASCADE' // Kaskadowa aktualizacja
      },
    });

    await queryInterface.changeColumn('messages_to_all', 'sendBy', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
        onDelete: 'CASCADE', // Kaskadowe kasowanie
        onUpdate: 'CASCADE' // Kaskadowa aktualizacja
      },
    });
  },

  down: async (queryInterface, Sequelize) => {}
};
