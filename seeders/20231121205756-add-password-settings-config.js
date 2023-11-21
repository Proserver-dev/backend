const APP_CONFIGURATION_DEFAULT = require('../src/constants/appConfigurationDefault')

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('app_configurations', [
      {
        key: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.key,
        value: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.value,
        type: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.key,
        value: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.value,
        type: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.key,
        value: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.value,
        type: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.key,
        value: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.value,
        type: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.key,
        value: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.value,
        type: APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const keys = [
      APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.key,
      APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.key,
      APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.key,
      APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.key,
      APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.key
    ];
    
    return queryInterface.bulkDelete('app_configurations', {
      key: {
        [Sequelize.Op.in]: keys,
      },
    });
  },
};
