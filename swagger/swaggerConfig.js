const { SETTINGS } = require("../settings");

module.exports = {
  info: {
    title: 'Ride Club',
    description: "Najlepsza apka dla kierowców",
    version: '1.0.0',
    contact: {
      name: "Ride Club",
      email: "ceo@rideclub.pl",
      url: "http://rideclub.pl",
    },
  },
  host: SETTINGS.SWAGGER_HOST,
  schemes: ['https'],
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-KEY',
      description: 'Some description...'
    }
  },
  definitions: {
    User: {
      id: 1,
      isActivated: true,
      email: "john@doe.dev",
      userName: "john123",
      nameLastname: "John Doe",
      role: {
          id: 2,
          name: "User",
          short: "user"
      },
      isLoggedIn: true,
      updatedAt: "2023-11-15T04:17:54.000Z",
      createdAt: "2023-11-07T20:16:13.000Z"
    },
  }
};
