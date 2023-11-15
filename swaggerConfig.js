const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Ride Club',
      description: "Najlepsza apka dla kierowców",
      version: '1.0.0',
      contact: {
        name: "Ride Club",
        email: "ceo@rideclub.pl",
        url: "rideclub.pl",
      },
    },
  },
  apis: ['./src/router.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;