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
  openapi: '2.0',
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-KEY',
      description: 'Some description...'
    }
  }
};
