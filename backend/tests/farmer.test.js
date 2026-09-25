/**
 * Farmer API test suite.
 * Place this file at: backend/tests/farmer.test.js
 * Requires the same setup as auth.test.js (jest, supertest, mongodb-memory-server
 * already installed; server.js already guarded with require.main === module).
 */
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;
let token; // reused across tests — obtained once via register+login

const registerAndLogin = async () => {
  await request(app).post("/api/auth/register").send({
    fullName: "Farmer Tester",
    mobileNumber: "9111111111",
    email: "farmertester@example.com",
    password: "password123",
  });
  const res = await request(app).post("/api/auth/login").send({
    identifier: "farmertester@example.com",
    password: "password123",
  });
  return res.body.data.token;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  await mongoose.connect(process.env.MONGO_URI);
  app = require("../server");
  token = await registerAndLogin();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Wipe only the Farmer collection between tests — keep the logged-in user
  await mongoose.connection.collection("farmers").deleteMany({});
});

const authed = (req) => req.set("Authorization", `Bearer ${token}`);

const samplePayload = () => ({
  farmerName: "Ramesh Kumar",
  mobileNumber: "9900112233",
  gender: "Male",
  dateOfBirth: "1978-03-12",
  address: { village: "Hosahalli", taluk: "Nanjangud", district: "Mysuru", state: "Karnataka", pinCode: "571301" },
  primaryOccupation: "Farming",
  farmingExperienceYears: 22,
});

describe("POST /api/farmers", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/farmers").send(samplePayload());
    expect(res.status).toBe(401);
  });

  it("creates a farmer when authenticated", async () => {
    const res = await authed(request(app).post("/api/farmers")).send(samplePayload());
    expect(res.status).toBe(201);
    expect(res.body.data.farmerName).toBe("Ramesh Kumar");
  });

  it("rejects a payload missing required fields", async () => {
    const res = await authed(request(app).post("/api/farmers")).send({ gender: "Male" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/farmers", () => {
  beforeEach(async () => {
    await authed(request(app).post("/api/farmers")).send(samplePayload());
    await authed(request(app).post("/api/farmers")).send({
      ...samplePayload(),
      farmerName: "Lakshmi Devi",
      mobileNumber: "9900223344",
      address: { ...samplePayload().address, district: "Mandya" },
    });
  });

  it("lists farmers with pagination info", async () => {
    const res = await authed(request(app).get("/api/farmers"));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it("filters by search term (name)", async () => {
    const res = await authed(request(app).get("/api/farmers?search=Lakshmi"));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].farmerName).toBe("Lakshmi Devi");
  });

  it("filters by district", async () => {
    const res = await authed(request(app).get("/api/farmers?district=Mandya"));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].address.district).toBe("Mandya");
  });
});

describe("GET /api/farmers/:id, PUT, DELETE", () => {
  let farmerId;

  beforeEach(async () => {
    const res = await authed(request(app).post("/api/farmers")).send(samplePayload());
    farmerId = res.body.data._id;
  });

  it("gets a single farmer by id", async () => {
    const res = await authed(request(app).get(`/api/farmers/${farmerId}`));
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(farmerId);
  });

  it("returns 404 for a non-existent farmer", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await authed(request(app).get(`/api/farmers/${fakeId}`));
    expect(res.status).toBe(404);
  });

  it("updates a farmer", async () => {
    const res = await authed(request(app).put(`/api/farmers/${farmerId}`)).send({
      farmerName: "Ramesh K Updated",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.farmerName).toBe("Ramesh K Updated");
  });

  it("soft-deletes a farmer with no active plantations", async () => {
    const res = await authed(request(app).delete(`/api/farmers/${farmerId}`));
    expect(res.status).toBe(200);

    const check = await authed(request(app).get(`/api/farmers/${farmerId}`));
    expect(check.body.data.isActive).toBe(false);
  });
});
