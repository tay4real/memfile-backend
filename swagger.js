const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MEMFILE Document Management API',
      version: '1.0.0',
      description: 'API documentation for the file and mail management system',
    },
    servers: [
      {
        url: 'http://localhost:4000/api', // adjust as needed
      },
    ],
  },
  apis: ['./src/services/**/*.js'], // scans your route files for Swagger comments
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
