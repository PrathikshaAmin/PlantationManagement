const express = require("express");
const router = express.Router();

const { getFarmerStats, getPlantationStats } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/farmers", getFarmerStats);
router.get("/plantations", getPlantationStats);

module.exports = router;
