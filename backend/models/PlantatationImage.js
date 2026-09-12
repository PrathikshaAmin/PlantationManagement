const mongoose = require("mongoose");

const plantationImageSchema = new mongoose.Schema(
  {
    plantation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plantation",
      required: true,
    },
    imageUrl: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Plantation Overview",
        "Plant Images",
        "Irrigation Images",
        "Other",
      ],
      default: "Other",
    },
    fileSizeBytes: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlantationImage", plantationImageSchema);
