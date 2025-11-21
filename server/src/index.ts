import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { prisma } from "./db";
import routerV1 from "./routes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

// Trust the Docker/Nginx Proxy
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send(":)");
});

app.use("/api/v1", routerV1);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database Connected");

    app.listen(port, () =>
      console.log(`Server is running at http://localhost:${port}`)
    );
  } catch (error) {
    console.error("Failed to Start Server", error);

    process.exit(1);
  }
};
startServer();
