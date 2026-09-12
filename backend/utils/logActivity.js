const PlantationActivity = require("../models/PlantationActivity");

/**
 * Records an entry in the Plantation Activity Log.
 * Never throws — logging failures should not break the primary request.
 */
const logActivity = async ({ plantation, activityType, remarks, performedBy }) => {
  try {
    await PlantationActivity.create({
      plantation,
      activityType,
      remarks,
      performedBy,
    });
  } catch (error) {
    console.error("Failed to write activity log:", error.message);
  }
};

module.exports = logActivity;
