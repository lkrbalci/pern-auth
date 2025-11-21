import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const routerV1 = Router();

routerV1.use("/auth", authRoutes);
routerV1.use("/users", userRoutes);

export default routerV1;
