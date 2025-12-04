import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  registerWithVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from "../schemas/auth.schema";
import { authRateLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication management (register, login, logout, refresh)
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Register a new user with email and password !!Comment out if email verification path is used!!
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *             - email
 *             - password
 *            properties:
 *              email:
 *                type: string
 *                default: user@example.com
 *              password:
 *                type: string
 *                default: password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad Request
 *       409:
 *         description: User with this email already exists
 */
router.post("/register", authRateLimiter, validate(RegisterSchema), register);

/**
 * @openapi
 * /auth/register-with-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user with email verification
 *     description: Register a new user with email and password also expect for email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *             - email
 *             - password
 *            properties:
 *              email:
 *                type: string
 *                default: user@example.com
 *              password:
 *                type: string
 *                default: password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad Request
 *       409:
 *         description: User with this email already exists
 */

router.post(
  "/register-with-verification",
  validate(RegisterSchema),
  registerWithVerification
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     description: Login a user with email and password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                default: user@example.com
 *              password:
 *                type: string
 *                default: password123!
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Invalid credentials
 */

router.post("/login", authRateLimiter, validate(LoginSchema), login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout a user
 *     description: Logout the authenticated user and revoke the refresh token
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post("/logout", logout);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Refresh the access token using HttpOnly cookie
 *     security:
 *      - cookieAuth: []
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 *       403:
 *         description: Token Reuse Detected - All Sessions Revoked
 */
router.post("/refresh", validate(RefreshSchema), refresh);

/**
 * @openapi
 * /auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verify Email
 *     description: Validates the token sent via email and activates the account.
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify-email", validate(VerifyEmailSchema), verifyEmail);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Forgot Password
 *     description: Sends email containing password reset link and token to provided user email address
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                default: user@example.com
 *     responses:
 *       200:
 *         description: Reset link has been sent.
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Invalid credentials
 */
router.post("/forgot-password", validate(ForgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password
 *     description: Reset user password after token verification token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *             - token
 *             - password
 *            properties:
 *              token:
 *                type: string
 *                required: true
 *              password:
 *                type: string
 *                default: password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Token invalid or expired
 */
router.post("/reset-password", validate(ResetPasswordSchema), resetPassword);

export default router;
