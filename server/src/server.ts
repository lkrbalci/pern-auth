import app from "./app";
import { prisma } from "./db";
import logger from "./utils/logger";
import "dotenv/config";

const port = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info("OK [database]: Connected to Database");

    app.listen(port, () =>
      logger.info(`OK [server]: Server is running at http://localhost:${port}`)
    );
  } catch (error) {
    logger.error("FAIL [server]: Failed to start server", error);

    process.exit(1);
  }
};

startServer();
