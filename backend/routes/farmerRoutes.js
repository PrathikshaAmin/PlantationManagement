const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  createFarmer,
  getFarmers,
  getFarmerById,
  updateFarmer,
  deleteFarmer,
} = require("../controllers/farmerController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(protect); // every farmer route requires auth

const farmerValidationRules = [
  body("farmerName").trim().notEmpty().withMessage("Farmer name is required"),
  body("mobileNumber").trim().notEmpty().withMessage("Mobile number is required"),
  body("gender").optional().isIn(["Male", "Female", "Other"]),
  body("dateOfBirth").optional().isISO8601().toDate(),
  body("farmingExperienceYears").optional().isFloat({ min: 0 }),
];

router.get("/", getFarmers);
router.post("/", farmerValidationRules, validate, createFarmer);
router.get("/:id", getFarmerById);
router.put("/:id", farmerValidationRules, validate, updateFarmer);
router.delete("/:id", deleteFarmer);

module.exports = router;
