const swaggerAutogen = require('swagger-autogen')();
const fs = require('fs');
const path = require('path');
const SwaggerOptions = require('./swagger/swaggerConfig')

const outputFile = './swagger/swaggerDefinitions.json';
const endpointsFiles = ['./src/router.js'];
swaggerAutogen(outputFile, endpointsFiles, SwaggerOptions);

const swaggerDefinitions = require(outputFile);

