const Plantation = require("../models/Plantation");
const PlantationLocation = require("../models/PlantationLocation");
const logActivity = require("../utils/logActivity");

// @desc    Save or update GPS coordinates for a plantation (upsert — one
//          current location per plantation, keeps things simple for the map)
// @route   POST /api/plantations/:id/location
// @access  Private
const saveLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const plantation = await Plantation.findById(req.params.id);
    if (!plantation) {
      return res.status(404).json({ success: false, message: "Plantation not found" });
    }

    const existed = await PlantationLocation.findOne({ plantation: plantation._id });

    const location = await PlantationLocation.findOneAndUpdate(
      { plantation: plantation._id },
      {
        latitude,
        longitude,
        capturedBy: req.user._id,
        capturedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    await logActivity({
      plantation: plantation._id,
      activityType: "Location Updated",
      remarks: existed
        ? `Coordinates updated to ${latitude}, ${longitude}`
        : `Coordinates captured: ${latitude}, ${longitude}`,
      performedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: existed ? "Location updated" : "Location saved",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current GPS coordinates for a plantation
// @route   GET /api/plantations/:id/location
// @access  Private
const getLocation = async (req, res, next) => {
  try {
    const location = await PlantationLocation.findOne({ plantation: req.params.id });
    if (!location) {
      return res.status(404).json({ success: false, message: "No location recorded yet" });
    }
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

module.exports = { saveLocation, getLocation };
