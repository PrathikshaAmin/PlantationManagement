const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    // Personal Information
    farmerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    alternateMobileNumber: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dateOfBirth: { type: Date },

    // Address Information
    address: {
      village: { type: String, trim: true },
      taluk: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      pinCode: { type: String, trim: true },
    },

    // Additional Information
    primaryOccupation: { type: String, trim: true },
    farmingExperienceYears: { type: Number, min: 0 },

    // Meta
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Virtual: number of plantations (populated on demand via a query, not stored)
farmerSchema.virtual("plantationCount", {
  ref: "Plantation",
  localField: "_id",
  foreignField: "farmer",
  count: true,
});
farmerSchema.set("toJSON", { virtuals: true });
farmerSchema.set("toObject", { virtuals: true });

farmerSchema.index({ farmerName: "text", mobileNumber: "text" });

module.exports = mongoose.model("Farmer", farmerSchema);
