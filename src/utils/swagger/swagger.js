const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json'
const endpointsFiles = [ "../../api/routes/*.ts" ]

const doc = {
    info: {
      title: 'Auth API',
      description: 'Auth microservice API',
    },
    schemes: ['http'],
    definitions:{
        registerUserDoc:{
                data: {
                    id: "uuid",
                    password: "1234"
            }
        },
    },
    host: process.env.LOCAL_HOST || "localhost:5000",
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger documentation generated successfully.');
}).catch(err => {
    console.error('Error generating Swagger documentation:', err);
});