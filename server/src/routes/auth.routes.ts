import { Router } from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
} from "../schemas/auth.schema";
import { authRateLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/register", authRateLimiter, validate(RegisterSchema), register);
router.post("/login", authRateLimiter, validate(LoginSchema), login);
router.post("/logout", logout);
router.post("/refresh", validate(RefreshSchema), refresh);

export default router;
