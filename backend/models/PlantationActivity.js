const mongoose = require("mongoose");

const plantationActivitySchema = new mongoose.Schema(
  {
    plantation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plantation",
      required: true,
    },
    activityType: {
      type: String,
      enum: [
        "Plantation Created",
        "Plantation Updated",
        "Area Modified",
        "Plantation Photo Added",
        "Location Updated",
        "Other",
      ],
      required: true,
    },
    remarks: { type: String, trim: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    activityDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlantationActivity", plantationActivitySchema);
