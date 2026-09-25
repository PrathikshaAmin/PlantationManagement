/**
 * Plantation API test suite — covers CRUD, GPS location, image upload,
 * and the auto-logged activity trail.
 * Place this file at: backend/tests/plantation.test.js
 */
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;
let token;
let farmerId;

// A minimal valid 1x1 PNG, used as an in-memory upload fixture — no file on disk needed
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const tinyPngBuffer = () => Buffer.from(TINY_PNG_BASE64, "base64");

const authed = (req) => req.set("Authorization", `Bearer ${token}`);

const registerAndLogin = async () => {
  await request(app).post("/api/auth/register").send({
    fullName: "Plantation Tester",
    mobileNumber: "9222222222",
    email: "planttester@example.com",
    password: "password123",
  });
  const res = await request(app).post("/api/auth/login").send({
    identifier: "planttester@example.com",
    password: "password123",
  });
  return res.body.data.token;
};

const createFarmer = async () => {
  const res = await authed(request(app).post("/api/farmers")).send({
    farmerName: "Suresh Gowda",
    mobileNumber: "9900334455",
    address: { village: "Malavalli", taluk: "Malavalli", district: "Mandya", state: "Karnataka" },
  });
  return res.body.data._id;
};

const samplePlantation = (overrides = {}) => ({
  farmer: farmerId,
  plantationName: "North Coconut Field",
  plantationCode: "PLT-TEST-001",
  plantationType: "Coconut",
  area: 2.5,
  areaUnit: "Acres",
  numberOfPlants: 120,
  irrigationMethod: "Drip",
  waterSource: "Borewell",
  soilType: "Red Loam",
  ...overrides,
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  await mongoose.connect(process.env.MONGO_URI);
  app = require("../server");
  token = await registerAndLogin();
  farmerId = await createFarmer();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await mongoose.connection.collection("plantations").deleteMany({});
  await mongoose.connection.collection("plantationlocations").deleteMany({});
  await mongoose.connection.collection("plantationimages").deleteMany({});
  await mongoose.connection.collection("plantationactivities").deleteMany({});
});

describe("Plantation CRUD", () => {
  it("rejects creating a plantation with an unknown farmer id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await authed(request(app).post("/api/plantations")).send(
      samplePlantation({ farmer: fakeId }),
    );
    expect(res.status).toBe(404);
  });

  it("creates a plantation linked to a farmer, and logs a 'Plantation Created' activity", async () => {
    const res = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    expect(res.status).toBe(201);
    expect(res.body.data.plantationCode).toBe("PLT-TEST-001");

    const activities = await authed(request(app).get(`/api/plantations/${res.body.data._id}/activities`));
    expect(activities.body.data.length).toBe(1);
    expect(activities.body.data[0].activityType).toBe("Plantation Created");
  });

  it("rejects a duplicate plantationCode", async () => {
    await authed(request(app).post("/api/plantations")).send(samplePlantation());
    const res = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    expect(res.status).toBe(400);
  });

  it("gets plantation details bundled with statistics and location", async () => {
    const created = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    const res = await authed(request(app).get(`/api/plantations/${created.body.data._id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.plantation.plantationCode).toBe("PLT-TEST-001");
    expect(res.body.data.statistics).toEqual({ imageCount: 0, activityCount: 1 });
    expect(res.body.data.location).toBeNull();
  });

  it("updates a plantation and logs 'Area Modified' when area changes", async () => {
    const created = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    const res = await authed(request(app).put(`/api/plantations/${created.body.data._id}`)).send({
      area: 3.2,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.area).toBe(3.2);

    const activities = await authed(request(app).get(`/api/plantations/${created.body.data._id}/activities`));
    expect(activities.body.data[0].activityType).toBe("Area Modified");
  });

  it("soft-deletes a plantation", async () => {
    const created = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    const res = await authed(request(app).delete(`/api/plantations/${created.body.data._id}`));
    expect(res.status).toBe(200);
  });

  it("filters the plantation list by type and farmer", async () => {
    await authed(request(app).post("/api/plantations")).send(samplePlantation());
    await authed(request(app).post("/api/plantations")).send(
      samplePlantation({ plantationName: "Coffee Estate", plantationCode: "PLT-TEST-002", plantationType: "Coffee" }),
    );

    const byType = await authed(request(app).get("/api/plantations?type=Coffee"));
    expect(byType.body.data.length).toBe(1);
    expect(byType.body.data[0].plantationType).toBe("Coffee");

    const byFarmer = await authed(request(app).get(`/api/plantations?farmer=${farmerId}`));
    expect(byFarmer.body.data.length).toBe(2);
  });
});

describe("GPS Location", () => {
  let plantationId;

  beforeEach(async () => {
    const res = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    plantationId = res.body.data._id;
  });

  it("returns 404 when no location has been captured yet", async () => {
    const res = await authed(request(app).get(`/api/plantations/${plantationId}/location`));
    expect(res.status).toBe(404);
  });

  it("saves a new location and logs a 'Location Updated' activity", async () => {
    const res = await authed(request(app).post(`/api/plantations/${plantationId}/location`)).send({
      latitude: 12.2958,
      longitude: 76.6394,
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Location saved");

    const activities = await authed(request(app).get(`/api/plantations/${plantationId}/activities`));
    expect(activities.body.data[0].activityType).toBe("Location Updated");
  });

  it("upserts (updates, not duplicates) on a second save", async () => {
    await authed(request(app).post(`/api/plantations/${plantationId}/location`)).send({
      latitude: 12.2958,
      longitude: 76.6394,
    });
    const res = await authed(request(app).post(`/api/plantations/${plantationId}/location`)).send({
      latitude: 12.3,
      longitude: 76.65,
    });
    expect(res.body.message).toBe("Location updated");

    const get = await authed(request(app).get(`/api/plantations/${plantationId}/location`));
    expect(get.body.data.latitude).toBe(12.3);
  });

  it("rejects an out-of-range latitude", async () => {
    const res = await authed(request(app).post(`/api/plantations/${plantationId}/location`)).send({
      latitude: 999,
      longitude: 76.6394,
    });
    expect(res.status).toBe(400);
  });
});

describe("Image Upload", () => {
  let plantationId;

  beforeEach(async () => {
    const res = await authed(request(app).post("/api/plantations")).send(samplePlantation());
    plantationId = res.body.data._id;
  });

  it("rejects a request with no files attached", async () => {
    const res = await authed(request(app).post(`/api/plantations/${plantationId}/images`));
    expect(res.status).toBe(400);
  });

  it("uploads an image, categorizes it, and logs a 'Plantation Photo Added' activity", async () => {
    const res = await authed(request(app).post(`/api/plantations/${plantationId}/images`))
      .field("category", "Plant Images")
      .attach("images", tinyPngBuffer(), { filename: "leaf.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data[0].category).toBe("Plant Images");
    expect(res.body.data[0].imageUrl).toMatch(/^\/uploads\/plantations\//);

    const activities = await authed(request(app).get(`/api/plantations/${plantationId}/activities`));
    expect(activities.body.data[0].activityType).toBe("Plantation Photo Added");
  });

  it("rejects a disallowed file type", async () => {
    const res = await authed(request(app).post(`/api/plantations/${plantationId}/images`)).attach(
      "images",
      Buffer.from("not a real file"),
      { filename: "notes.txt", contentType: "text/plain" },
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("lists uploaded images for a plantation", async () => {
    await authed(request(app).post(`/api/plantations/${plantationId}/images`)).attach(
      "images",
      tinyPngBuffer(),
      { filename: "leaf.png", contentType: "image/png" },
    );
    const res = await authed(request(app).get(`/api/plantations/${plantationId}/images`));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it("deletes an image via /api/images/:imageId", async () => {
    const uploaded = await authed(request(app).post(`/api/plantations/${plantationId}/images`)).attach(
      "images",
      tinyPngBuffer(),
      { filename: "leaf.png", contentType: "image/png" },
    );
    const imageId = uploaded.body.data[0]._id;

    const res = await authed(request(app).delete(`/api/images/${imageId}`));
    expect(res.status).toBe(200);

    const list = await authed(request(app).get(`/api/plantations/${plantationId}/images`));
    expect(list.body.data.length).toBe(0);
  });
});
