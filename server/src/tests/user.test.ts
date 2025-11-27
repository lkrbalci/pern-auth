import request from "supertest";

import app from "../app";
import { prisma } from "../db";
import { signAccessToken } from "../utils/jwt";

const createAuthanticatedUser = async () => {
  const user = await prisma.user.create({
    data: {
      email: `testuser_${Date.now()}_${Math.random()}@example.com`,
      password: "hashedpassword123",
      name: "Test User",
    },
  });

  const token = signAccessToken(user);

  return { user, token };
};

afterAll(async () => {
  await prisma.$disconnect();
});

describe("User Endpoints (Protected)", () => {
  describe("GET /api/users/me", () => {
    it("should return the authenticated user's profile", async () => {
      const { user, token } = await createAuthanticatedUser();

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });

    it("Should return 401 if token is wrong"),
      async () => {
        const res = await request(app)
          .get("/api/v1/users/me")
          .set("Authorization", "Bearer invalid_garbage_string");

        expect(res.status).toBe(401);
      };
  });
});
