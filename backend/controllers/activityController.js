const PlantationActivity = require("../models/PlantationActivity");

// @desc    Get activity history for a plantation, most recent first
// @route   GET /api/plantations/:id/activities
// @access  Private
const getPlantationActivities = async (req, res, next) => {
  try {
    const activities = await PlantationActivity.find({ plantation: req.params.id })
      .populate("performedBy", "fullName")
      .sort({ activityDate: -1 });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlantationActivities };
