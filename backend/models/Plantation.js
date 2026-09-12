const mongoose = require("mongoose");

const plantationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    // Basic Information
    plantationName: { type: String, required: true, trim: true },
    plantationCode: { type: String, required: true, unique: true, trim: true },
    plantationType: { type: String, trim: true }, // e.g. Coconut, Areca, Coffee

    // Area Information
    area: { type: Number, required: true }, // numeric value
    areaUnit: { type: String, enum: ["Acres", "Hectares"], default: "Acres" },
    numberOfPlants: { type: Number, min: 0 },

    // Location Information
    address: {
      village: { type: String, trim: true },
      taluk: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // Farming Information
    irrigationMethod: { type: String, trim: true },
    waterSource: { type: String, trim: true },
    soilType: { type: String, trim: true },

    // Plantation Information
    plantationAgeYears: { type: Number, min: 0 },
    plantVariety: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

plantationSchema.index({ plantationName: "text", plantationCode: "text" });

module.exports = mongoose.model("Plantation", plantationSchema);
