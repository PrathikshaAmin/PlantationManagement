const Farmer = require("../models/Farmer");
const Plantation = require("../models/Plantation");

// @desc    Create a new farmer
// @route   POST /api/farmers
// @access  Private
const createFarmer = async (req, res, next) => {
  try {
    const farmer = await Farmer.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, message: "Farmer created", data: farmer });
  } catch (error) {
    next(error);
  }
};

// @desc    List farmers with search, filter, pagination
// @route   GET /api/farmers?search=&district=&page=&limit=
// @access  Private
const getFarmers = async (req, res, next) => {
  try {
    const { search, district, page = 1, limit = 20, includeInactive } = req.query;

    const query = {};
    if (!includeInactive) query.isActive = true;
    if (district) query["address.district"] = district;
    if (search) {
      query.$or = [
        { farmerName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [farmers, total] = await Promise.all([
      Farmer.find(query)
        .populate("plantationCount")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Farmer.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: farmers,
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

// @desc    Get single farmer details (with plantation count + last updated)
// @route   GET /api/farmers/:id
// @access  Private
const getFarmerById = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate("plantationCount");
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.status(200).json({ success: true, data: farmer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update farmer
// @route   PUT /api/farmers/:id
// @access  Private
const updateFarmer = async (req, res, next) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.status(200).json({ success: true, message: "Farmer updated", data: farmer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete farmer (soft delete)
// @route   DELETE /api/farmers/:id
// @access  Private
const deleteFarmer = async (req, res, next) => {
  try {
    const activePlantations = await Plantation.countDocuments({
      farmer: req.params.id,
      isActive: true,
    });
    if (activePlantations > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: farmer has ${activePlantations} active plantation(s). Remove or reassign them first.`,
      });
    }

    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.status(200).json({ success: true, message: "Farmer deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createFarmer, getFarmers, getFarmerById, updateFarmer, deleteFarmer };
