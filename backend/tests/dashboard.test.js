/**
 * Dashboard API test suite.
 * Place this file at: backend/tests/dashboard.test.js
 */
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;
let token;

const authed = (req) => req.set("Authorization", `Bearer ${token}`);

const registerAndLogin = async () => {
  await request(app).post("/api/auth/register").send({
    fullName: "Dashboard Tester",
    mobileNumber: "9333333333",
    email: "dashtester@example.com",
    password: "password123",
  });
  const res = await request(app).post("/api/auth/login").send({
    identifier: "dashtester@example.com",
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
  await mongoose.connection.collection("farmers").deleteMany({});
  await mongoose.connection.collection("plantations").deleteMany({});
});

describe("GET /api/dashboard/farmers", () => {
  it("returns zeroed stats when there is no data", async () => {
    const res = await authed(request(app).get("/api/dashboard/farmers"));
    expect(res.status).toBe(200);
    expect(res.body.data.totalFarmers).toBe(0);
    expect(res.body.data.districtWise).toEqual([]);
  });

  it("returns correct totals and district breakdown", async () => {
    await authed(request(app).post("/api/farmers")).send({
      farmerName: "A", mobileNumber: "9000000011", address: { district: "Mysuru" },
    });
    await authed(request(app).post("/api/farmers")).send({
      farmerName: "B", mobileNumber: "9000000012", address: { district: "Mysuru" },
    });
    await authed(request(app).post("/api/farmers")).send({
      farmerName: "C", mobileNumber: "9000000013", address: { district: "Mandya" },
    });

    const res = await authed(request(app).get("/api/dashboard/farmers"));
    expect(res.body.data.totalFarmers).toBe(3);
    expect(res.body.data.activeFarmers).toBe(3);
    const mysuru = res.body.data.districtWise.find((d) => d.district === "Mysuru");
    expect(mysuru.count).toBe(2);
  });
});

describe("GET /api/dashboard/plantations", () => {
  let farmerId;

  beforeEach(async () => {
    const res = await authed(request(app).post("/api/farmers")).send({
      farmerName: "Farmer For Plantations", mobileNumber: "9000000099",
    });
    farmerId = res.body.data._id;
  });

  it("returns zeroed stats when there is no data", async () => {
    const res = await authed(request(app).get("/api/dashboard/plantations"));
    expect(res.status).toBe(200);
    expect(res.body.data.totalPlantations).toBe(0);
    expect(res.body.data.totalArea).toBe(0);
  });

  it("sums total area and groups by type correctly", async () => {
    await authed(request(app).post("/api/plantations")).send({
      farmer: farmerId, plantationName: "P1", plantationCode: "PC-1", plantationType: "Coconut", area: 2,
    });
    await authed(request(app).post("/api/plantations")).send({
      farmer: farmerId, plantationName: "P2", plantationCode: "PC-2", plantationType: "Coconut", area: 3,
    });
    await authed(request(app).post("/api/plantations")).send({
      farmer: farmerId, plantationName: "P3", plantationCode: "PC-3", plantationType: "Coffee", area: 4,
    });

    const res = await authed(request(app).get("/api/dashboard/plantations"));
    expect(res.body.data.totalPlantations).toBe(3);
    expect(res.body.data.totalArea).toBe(9);
    const coconut = res.body.data.typeDistribution.find((t) => t.type === "Coconut");
    expect(coconut.count).toBe(2);
    expect(res.body.data.recentlyUpdated.length).toBe(3);
  });
});
