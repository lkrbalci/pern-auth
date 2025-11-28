import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import logger from "./logger";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PERN Auth API",
      version: "1.0.0",
      description: "API documentation for the PERN Auth application",
    },
    contact: {
      name: "BeeNest Digital",
      email: "ilker@beenestdigital.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    cookieAuth: {
      type: "apiKey",
      in: "cookie",
      name: "refreshToken",
    },
  },
  apis: [
    "./src/routes/*.ts",
    "./src/schemas/*.ts",
    "./dist/routes/*.js",
    "./dist/schemas/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export const swaggerDocs = (app: Express, port: number | string) => {
  app.get("/api/v1/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  logger.info(
    `[swagger]: Swagger docs available at http://localhost:${port}/api/v1/docs`
  );
};
