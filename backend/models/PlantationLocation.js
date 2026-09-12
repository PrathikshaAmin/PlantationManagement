const mongoose = require("mongoose");

const plantationLocationSchema = new mongoose.Schema(
  {
    plantation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plantation",
      required: true,
    },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlantationLocation", plantationLocationSchema);
