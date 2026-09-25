/**
 * Seed script — populates demo data for a Farm Profile & Plantation
 * Management System demo: one admin user, a handful of farmers, plantations,
 * locations, and activity log entries. No images are uploaded (that still
 * needs real files), but plantation records are otherwise demo-ready.
 *
 * Place this file at: backend/seed.js
 * Run it with:         node seed.js            (wipes & reseeds demo data)
 *                       node seed.js --keep     (adds without wiping first)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Farmer = require("./models/Farmer");
const Plantation = require("./models/Plantation");
const PlantationLocation = require("./models/PlantationLocation");
const PlantationActivity = require("./models/PlantationActivity");

const KEEP_EXISTING = process.argv.includes("--keep");

const DEMO_FARMERS = [
  {
    farmerName: "Ramesh Kumar",
    mobileNumber: "9900112233",
    gender: "Male",
    dateOfBirth: new Date("1978-03-12"),
    address: {
      village: "Hosahalli",
      taluk: "Nanjangud",
      district: "Mysuru",
      state: "Karnataka",
      pinCode: "571301",
    },
    primaryOccupation: "Farming",
    farmingExperienceYears: 22,
  },
  {
    farmerName: "Lakshmi Devi",
    mobileNumber: "9900223344",
    gender: "Female",
    dateOfBirth: new Date("1985-07-04"),
    address: {
      village: "Bilikere",
      taluk: "Hunsur",
      district: "Mysuru",
      state: "Karnataka",
      pinCode: "571105",
    },
    primaryOccupation: "Farming",
    farmingExperienceYears: 15,
  },
  {
    farmerName: "Suresh Gowda",
    mobileNumber: "9900334455",
    gender: "Male",
    dateOfBirth: new Date("1969-11-20"),
    address: {
      village: "Malavalli",
      taluk: "Malavalli",
      district: "Mandya",
      state: "Karnataka",
      pinCode: "571430",
    },
    primaryOccupation: "Farming",
    farmingExperienceYears: 30,
  },
];

const DEMO_PLANTATIONS = [
  {
    plantationName: "North Coconut Field",
    plantationCode: "PLT-DEMO-001",
    plantationType: "Coconut",
    area: 2.5,
    areaUnit: "Acres",
    numberOfPlants: 120,
    irrigationMethod: "Drip",
    waterSource: "Borewell",
    soilType: "Red Loam",
    plantationAgeYears: 6,
    plantVariety: "Tall variety",
    location: { latitude: 12.2958, longitude: 76.6394 },
  },
  {
    plantationName: "Riverside Coffee Estate",
    plantationCode: "PLT-DEMO-002",
    plantationType: "Coffee",
    area: 4,
    areaUnit: "Acres",
    numberOfPlants: 900,
    irrigationMethod: "Sprinkler",
    waterSource: "Canal",
    soilType: "Loamy",
    plantationAgeYears: 3,
    plantVariety: "Arabica",
    location: { latitude: 12.3081, longitude: 76.6552 },
  },
  {
    plantationName: "South Areca Grove",
    plantationCode: "PLT-DEMO-003",
    plantationType: "Areca",
    area: 1.8,
    areaUnit: "Acres",
    numberOfPlants: 300,
    irrigationMethod: "Drip",
    waterSource: "Borewell",
    soilType: "Sandy Loam",
    plantationAgeYears: 8,
    plantVariety: "Local",
    location: { latitude: 12.2843, longitude: 76.6217 },
  },
];

const run = async () => {
  await connectDB();

  if (!KEEP_EXISTING) {
    console.log("Wiping existing demo-relevant collections...");
    await Promise.all([
      PlantationActivity.deleteMany({}),
      PlantationLocation.deleteMany({}),
      Plantation.deleteMany({}),
      Farmer.deleteMany({}),
    ]);
  }

  console.log("Creating demo admin user (skipped if it already exists)...");
  let admin = await User.findOne({ email: "admin@demo.com" });
  if (!admin) {
    admin = await User.create({
      fullName: "Demo Admin",
      mobileNumber: "9000000000",
      email: "admin@demo.com",
      password: "Demo@1234", // hashed automatically by the User model
      role: "admin",
    });
    console.log("  Created admin@demo.com / Demo@1234");
  } else {
    console.log("  admin@demo.com already exists — reusing it");
  }

  console.log("Creating demo farmers...");
  const farmers = await Farmer.create(
    DEMO_FARMERS.map((f) => ({ ...f, createdBy: admin._id })),
  );

  console.log(
    "Creating demo plantations, locations, and activity log entries...",
  );
  for (let i = 0; i < DEMO_PLANTATIONS.length; i++) {
    const { location, ...plantationData } = DEMO_PLANTATIONS[i];
    const farmer = farmers[i % farmers.length];

    const plantation = await Plantation.create({
      ...plantationData,
      farmer: farmer._id,
      address: farmer.address,
      createdBy: admin._id,
    });

    await PlantationLocation.create({
      plantation: plantation._id,
      latitude: location.latitude,
      longitude: location.longitude,
      capturedBy: admin._id,
    });

    await PlantationActivity.create([
      {
        plantation: plantation._id,
        activityType: "Plantation Created",
        remarks: `Plantation "${plantation.plantationName}" created`,
        performedBy: admin._id,
      },
      {
        plantation: plantation._id,
        activityType: "Location Updated",
        remarks: `Coordinates captured: ${location.latitude}, ${location.longitude}`,
        performedBy: admin._id,
      },
    ]);
  }

  console.log("\nSeed complete:");
  console.log(`  Farmers: ${farmers.length}`);
  console.log(`  Plantations: ${DEMO_PLANTATIONS.length}`);
  console.log("  Login with: admin@demo.com / Demo@1234\n");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
