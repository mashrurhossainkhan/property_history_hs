const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hubxpert API',
      version: '1.0.0',
      description: 'API documentation for the Hubxpert Data Formatter App',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server'
      },
      {
        url: 'https://app.dataformatter.my.id',
        description: 'Production server'
      }
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
