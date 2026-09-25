/**
 * Starter test suite — Auth API.
 * Place this file at: backend/tests/auth.test.js
 *
 * Requires two dev dependencies (see README section below for install command):
 *   jest, supertest, mongodb-memory-server
 *
 * This is a starting point, not full coverage — extend with farmer.test.js,
 * plantation.test.js, etc. following the same pattern.
 */
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.setTimeout(30000);

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  await mongoose.connect(process.env.MONGO_URI);
  app = require("../server"); // server.js must export `app` without calling listen() in test mode — see PENDING_CHANGES.md
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Test User",
      mobileNumber: "9000000001",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      fullName: "Test User",
      mobileNumber: "9000000001",
      email: "test@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Another User",
      mobileNumber: "9000000002",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a request missing required fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "nofields@example.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      fullName: "Login Tester",
      mobileNumber: "9000000003",
      email: "login@example.com",
      password: "password123",
    });
  });

  it("logs in with correct email + password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      identifier: "login@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("logs in with mobile number instead of email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      identifier: "9000000003",
      password: "password123",
    });
    expect(res.status).toBe(200);
  });

  it("rejects a wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      identifier: "login@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the logged-in user's profile with a valid token", async () => {
    await request(app).post("/api/auth/register").send({
      fullName: "Me Tester",
      mobileNumber: "9000000004",
      email: "me@example.com",
      password: "password123",
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      identifier: "me@example.com",
      password: "password123",
    });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("me@example.com");
  });
});
