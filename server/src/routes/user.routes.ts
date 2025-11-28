import { Router } from "express";
import { getMe } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: User
 *   description: User profile management
 */

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [User]
 *     summary: Get authenticated user's profile
 *     description: Retrieve the profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *         application/json:
 *            schema:
 *              type: object
 *            properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get("/me", authenticate, getMe);

export default router;
