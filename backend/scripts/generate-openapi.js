const swaggerJSDoc = require("swagger-jsdoc");
const fs = require("fs");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product Service API",
      version: "1.0.0",
    },
  },
  apis: [path.join(__dirname, "../product-service/*.ts")],
};

const swaggerSpec = swaggerJSDoc(options);

fs.writeFileSync(
  path.join(__dirname, "../openapi.json"),
  JSON.stringify(swaggerSpec, null, 2)
);

console.log("OpenAPI spec generated successfully!");
