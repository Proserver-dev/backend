const swaggerAutogen = require('swagger-autogen')();
const fs = require('fs');
const path = require('path');
const SwaggerOptions = require('./swagger/swaggerConfig')

const outputFile = './swagger/swaggerDefinitions.json';
const endpointsFiles = ['./src/router.js'];

const doc = {
    ...SwaggerOptions,
    components: {
      schemas: SwaggerOptions.definitions,
    },
};

swaggerAutogen(outputFile, endpointsFiles, doc);

const swaggerDefinitions = require(outputFile);

