import "dotenv/config";
import app from "./app";
import { prisma } from "./db";
import logger from "./utils/logger";

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info("OK [database]: Connected to Database");

    const server = app.listen(port, () => {
      logger.info(`OK [server]: Server is running at http://localhost:${port}`);
    });

    const shutdown = async () => {
      logger.info("SIGTERM received. Shutting down with STYLE ;)");

      server.close(async () => {
        logger.info("HTTP server shutdown");

        await prisma.$disconnect();
        logger.info("Database disconnected");

        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("FAIL [server]: Failed to start server", error);
    process.exit(1);
  }
};

startServer();
