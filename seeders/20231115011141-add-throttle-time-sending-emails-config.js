const APP_CONFIGURATION_DEFAULT = require('../src/constants/appConfigurationDefault')

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('app_configurations', [
      {
        key: APP_CONFIGURATION_DEFAULT.THROTTLE_TIME_SENDING_EMAILS.key,
        value: APP_CONFIGURATION_DEFAULT.THROTTLE_TIME_SENDING_EMAILS.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const keys = [
      APP_CONFIGURATION_DEFAULT.THROTTLE_TIME_SENDING_EMAILS.key,
    ];
    
    return queryInterface.bulkDelete('app_configurations', {
      key: {
        [Sequelize.Op.in]: keys,
      },
    });
  },
};
