const APP_CONFIGURATION_DEFAULT = require('../src/constants/appConfigurationDefault')

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('app_configurations', [
      {
        key: APP_CONFIGURATION_DEFAULT.REGISTRATION_ENABLED.key,
        value: APP_CONFIGURATION_DEFAULT.REGISTRATION_ENABLED.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.REGISTRATION_DISABLED_REASON.key,
        value: APP_CONFIGURATION_DEFAULT.REGISTRATION_DISABLED_REASON.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key,
        value: APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key,
        value: APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.LOGIN_TOKEN_LIFE_TIME.key,
        value: APP_CONFIGURATION_DEFAULT.LOGIN_TOKEN_LIFE_TIME.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: APP_CONFIGURATION_DEFAULT.REFRESH_TOKEN_LIFE_TIME.key,
        value: APP_CONFIGURATION_DEFAULT.REFRESH_TOKEN_LIFE_TIME.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const keys = [
      APP_CONFIGURATION_DEFAULT.REGISTRATION_ENABLED.key,
      APP_CONFIGURATION_DEFAULT.REGISTRATION_DISABLED_REASON.key,
      APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key,
      APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key,
      APP_CONFIGURATION_DEFAULT.LOGIN_TOKEN_LIFE_TIME.key,
      APP_CONFIGURATION_DEFAULT.REFRESH_TOKEN_LIFE_TIME.key,
    ];
    
    return queryInterface.bulkDelete('app_configurations', {
      key: {
        [Sequelize.Op.in]: keys,
      },
    });
  },
};
