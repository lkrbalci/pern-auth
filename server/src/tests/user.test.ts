import request from "supertest";

import app from "../app";
import { prisma } from "../db";
import { signAccessToken } from "../utils/jwt";

let createdUserEmail: string;

const createAuthanticatedUser = async () => {
  const email = `test_user_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: `test_user_${Date.now()}@example.com`,
      password: "hashedpassword123",
      name: "Test User",
    },
  });

  createdUserEmail = email;
  const token = signAccessToken(user);

  return { user, token };
};

afterAll(async () => {
  if (createdUserEmail) {
    await prisma.user.deleteMany({ where: { email: createdUserEmail } });
  }
  await prisma.$disconnect();
});

describe("User Endpoints (Protected)", () => {
  describe("GET /api/v1/users/me", () => {
    it("should return the authenticated user's profile", async () => {
      const { user, token } = await createAuthanticatedUser();

      const res = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app).get("/api/v1/users/me");
      expect(res.status).toBe(401);
    });

    it("Should return 401 if token is wrong", async () => {
      const res = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", "Bearer invalid_string");

      expect(res.status).toBe(401);
    });
  });
});
