import request from "supertest";
import { prisma } from "../db";
import app from "../app";

beforeAll(async () => {});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth API", () => {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: "password",
    name: "Test User",
  };

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user and return tokens", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty("id");
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.email).toBe(testUser.email);

      expect(res.body.user).not.toHaveProperty("password");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken/);
      expect(cookies[0]).toMatch(/HttpOnly/);
    });

    it("should fail if email is invalid", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "invalid-email",
        password: "password",
      });

      expect(res.statusCode).toEqual(400);
    });
  });
});
