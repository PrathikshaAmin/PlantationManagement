const fs = require("fs");
const path = require("path");
const Plantation = require("../models/Plantation");
const PlantationImage = require("../models/PlantatationImage");
const logActivity = require("../utils/logActivity");

const VALID_CATEGORIES = [
  "Plantation Overview",
  "Plant Images",
  "Irrigation Images",
  "Other",
];

// @desc    Upload one or more images for a plantation
// @route   POST /api/plantations/:id/images  (multipart/form-data, field: images, optional: category)
// @access  Private
const uploadImages = async (req, res, next) => {
  try {
    const plantation = await Plantation.findById(req.params.id);
    if (!plantation) {
      return res.status(404).json({ success: false, message: "Plantation not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images uploaded" });
    }

    const category = VALID_CATEGORIES.includes(req.body.category)
      ? req.body.category
      : "Other";

    const docs = await PlantationImage.insertMany(
      req.files.map((file) => ({
        plantation: plantation._id,
        imageUrl: `/uploads/plantations/${file.filename}`,
        category,
        fileSizeBytes: file.size,
        uploadedBy: req.user._id,
      })),
    );

    await logActivity({
      plantation: plantation._id,
      activityType: "Plantation Photo Added",
      remarks: `${docs.length} image(s) added under "${category}"`,
      performedBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Images uploaded", data: docs });
  } catch (error) {
    next(error);
  }
};

// @desc    List images for a plantation, optionally filtered by category
// @route   GET /api/plantations/:id/images?category=
// @access  Private
const getImages = async (req, res, next) => {
  try {
    const query = { plantation: req.params.id };
    if (req.body.category || req.query.category) {
      query.category = req.query.category;
    }
    const images = await PlantationImage.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single image (removes file + DB record)
// @route   DELETE /api/images/:imageId
// @access  Private
const deleteImage = async (req, res, next) => {
  try {
    const image = await PlantationImage.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    const filePath = path.join(__dirname, "..", image.imageUrl.replace(/^\/+/, ""));
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to remove image file:", err.message);
    });

    await image.deleteOne();

    res.status(200).json({ success: true, message: "Image deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImages, getImages, deleteImage };
