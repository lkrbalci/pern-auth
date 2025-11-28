import request from "supertest";
import { prisma } from "../db";
import app from "../app";

beforeAll(async () => {});

afterAll(async () => {
  await prisma.$disconnect();
});

const generateUser = () => ({
  email: `test_${Date.now()}_${Math.random()}@example.com`,
  password: "password123!",
  name: "Test User",
});

let userA = generateUser();

beforeAll(async () => {
  // Generate the user before any tests
  userA = generateUser();
});

afterAll(async () => {
  // Clean up created users
  await prisma.user.deleteMany({ where: { email: userA.email } });
  await prisma.$disconnect();
});

describe("Auth flow", () => {
  let refreshToken: string;
  let accessToken: string;

  it("should register a new user", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(userA);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(userA.email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.accessToken).toBeDefined();

    // Test Cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    //refreshToken=ey...xyz; Path=/; HttpOnly; Secure; SameSite=Strict
    refreshToken = cookies[0].split(";")[0].split("=")[1];
  });

  it("should login user", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userA.email,
      password: userA.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    accessToken = res.body.accessToken;
  });

  it("should access protected route with token", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userA.email);
  });

  it("should refresh session using cookie", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userA.email, password: userA.password });

    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.accressToken).not.toBe(accessToken);
  });

  it("should reject invalid input", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "bad_mail", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("email");
  });
});
