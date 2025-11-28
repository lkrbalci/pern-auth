import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import routerV1 from "./routes";
import { errorHandler } from "./middlewares/error.midleware";
import morganMiddleware from "./middlewares/morgan.middleware";
import { globalRateLimiter } from "./middlewares/rateLimit.middleware";
import cookieParser from "cookie-parser";
import { swaggerDocs } from "./utils/swagger";

dotenv.config();

const app: Express = express();

// Trust the Docker/Nginx Proxy
app.set("trust proxy", 1);

app.use(morganMiddleware);
app.use("/api/", globalRateLimiter);
app.use(express.json());
app.use(cookieParser());
app.use(cors()); // Do not forget to configure CORS in production!

app.get("/", (req: Request, res: Response) => {
  res.send(":)");
});

app.get("/health", (req, res) =>
  res.status(200).json({ status: "UP", timestamp: new Date() })
);

app.use("/api/v1", routerV1);

swaggerDocs(app, process.env.PORT || 5000);

app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
