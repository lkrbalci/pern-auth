import request from "supertest";
import { prisma } from "../db";
import app from "../app";
import * as EmailService from "../services/email.service";

const createdEmails: string[] = [];

const generateUser = () => {
  const email = `test_${Date.now()}_${Math.random()}@example.com`;
  createdEmails.push(email);
  return {
    email,
    password: "password123!",
    name: "Test User",
  };
};

const sendVerificatonSpy = jest
  .spyOn(EmailService, "sendVerificationEmail")
  .mockResolvedValue();

const sendPasswordResetSpy = jest
  .spyOn(EmailService, "sendPasswordResetEmail")
  .mockResolvedValue();

afterAll(async () => {
  // Clean up created users
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  await prisma.$disconnect();
});

describe("Auth flow without verification", () => {
  let userA = generateUser();
  let accessToken: string;
  let cookies: string[];

  it("should register a new user", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(userA);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.password).toBeUndefined();

    // Test Cookie
    const rawCookie = res.headers["set-cookie"];
    cookies = Array.isArray(rawCookie) ? rawCookie : [rawCookie as string];
    expect(cookies).toBeDefined();

    accessToken = res.body.accessToken;
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
    expect(res.body.accessToken).not.toBe(accessToken);
  });
});

describe("Auth flow with verification", () => {
  let userB = generateUser();
  let verificationToken: string;

  it("should register but not return token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register-with-verification")
      .send(userB);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.requireVerification).toBe(true);

    expect(sendVerificatonSpy).toHaveBeenCalled();
    // Get the last call
    const calls = sendVerificatonSpy.mock.calls;
    const lastCall = calls[calls.length - 1];
    // The token is the second argument
    verificationToken = lastCall[1];
  });

  it("should not login before verification", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userB.email,
      password: userB.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verify/i);
  });

  it("should verify email with token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: verificationToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/success/i);
  });

  it("should login after verification", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userB.email,
      password: userB.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});

describe("Password reset flow", () => {
  let userC = generateUser();

  beforeAll(async () => {
    await request(app).post("/api/v1/auth/register").send(userC);
  });
});

describe("Auth input validation", () => {
  it("should reject invalid input", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "bad_mail", password: "123" });

    expect(res.status).toBe(400);
  });
});
