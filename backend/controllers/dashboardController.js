const Farmer = require("../models/Farmer");
const Plantation = require("../models/Plantation");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// @desc    Farmer dashboard stats: total, recent, active, district-wise
// @route   GET /api/dashboard/farmers
// @access  Private
const getFarmerStats = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - THIRTY_DAYS_MS);

    const [total, active, recent, districtWise] = await Promise.all([
      Farmer.countDocuments({}),
      Farmer.countDocuments({ isActive: true }),
      Farmer.countDocuments({ createdAt: { $gte: since } }),
      Farmer.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$address.district", count: { $sum: 1 } } },
        { $project: { _id: 0, district: { $ifNull: ["$_id", "Unspecified"] }, count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalFarmers: total,
        activeFarmers: active,
        recentlyAddedFarmers: recent,
        districtWise,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Plantation dashboard stats: total, total area, type distribution, recently updated
// @route   GET /api/dashboard/plantations
// @access  Private
const getPlantationStats = async (req, res, next) => {
  try {
    const [total, areaAgg, typeDistribution, recentlyUpdated] = await Promise.all([
      Plantation.countDocuments({ isActive: true }),
      Plantation.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalArea: { $sum: "$area" } } },
      ]),
      Plantation.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$plantationType", count: { $sum: 1 } } },
        { $project: { _id: 0, type: { $ifNull: ["$_id", "Unspecified"] }, count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Plantation.find({ isActive: true })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("plantationName plantationCode updatedAt")
        .populate("farmer", "farmerName"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPlantations: total,
        totalArea: areaAgg[0]?.totalArea || 0,
        typeDistribution,
        recentlyUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFarmerStats, getPlantationStats };
