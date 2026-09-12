const Plantation = require("../models/Plantation");
const Farmer = require("../models/Farmer");
const PlantationImage = require("../models/PlantatationImage");
const PlantationActivity = require("../models/PlantationActivity");
const PlantationLocation = require("../models/PlantationLocation");
const logActivity = require("../utils/logActivity");

// @desc    Create plantation linked to a farmer
// @route   POST /api/plantations
// @access  Private
const createPlantation = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.body.farmer);
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }

    const plantation = await Plantation.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await logActivity({
      plantation: plantation._id,
      activityType: "Plantation Created",
      remarks: `Plantation "${plantation.plantationName}" created`,
      performedBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Plantation created", data: plantation });
  } catch (error) {
    next(error);
  }
};

// @desc    List plantations with search/filter, optionally scoped to a farmer
// @route   GET /api/plantations?search=&farmer=&type=&page=&limit=
// @access  Private
const getPlantations = async (req, res, next) => {
  try {
    const { search, farmer, type, page = 1, limit = 20, includeInactive } = req.query;

    const query = {};
    if (!includeInactive) query.isActive = true;
    if (farmer) query.farmer = farmer;
    if (type) query.plantationType = type;
    if (search) {
      query.$or = [
        { plantationName: { $regex: search, $options: "i" } },
        { plantationCode: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [plantations, total] = await Promise.all([
      Plantation.find(query)
        .populate("farmer", "farmerName mobileNumber")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Plantation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: plantations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Plantation details: info, owner, area, statistics
// @route   GET /api/plantations/:id
// @access  Private
const getPlantationById = async (req, res, next) => {
  try {
    const plantation = await Plantation.findById(req.params.id).populate("farmer");
    if (!plantation) {
      return res.status(404).json({ success: false, message: "Plantation not found" });
    }

    const [imageCount, activityCount, location] = await Promise.all([
      PlantationImage.countDocuments({ plantation: plantation._id }),
      PlantationActivity.countDocuments({ plantation: plantation._id }),
      PlantationLocation.findOne({ plantation: plantation._id }).sort({ capturedAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        plantation,
        statistics: { imageCount, activityCount },
        location: location || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update plantation (logs "Area Modified" if area changed)
// @route   PUT /api/plantations/:id
// @access  Private
const updatePlantation = async (req, res, next) => {
  try {
    const existing = await Plantation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Plantation not found" });
    }

    const areaChanged =
      req.body.area !== undefined && Number(req.body.area) !== existing.area;

    const plantation = await Plantation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logActivity({
      plantation: plantation._id,
      activityType: areaChanged ? "Area Modified" : "Plantation Updated",
      remarks: areaChanged
        ? `Area changed from ${existing.area} to ${plantation.area} ${plantation.areaUnit}`
        : "Plantation details updated",
      performedBy: req.user._id,
    });

    res.status(200).json({ success: true, message: "Plantation updated", data: plantation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete plantation (soft delete)
// @route   DELETE /api/plantations/:id
// @access  Private
const deletePlantation = async (req, res, next) => {
  try {
    const plantation = await Plantation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!plantation) {
      return res.status(404).json({ success: false, message: "Plantation not found" });
    }
    res.status(200).json({ success: true, message: "Plantation deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlantation,
  getPlantations,
  getPlantationById,
  updatePlantation,
  deletePlantation,
};
