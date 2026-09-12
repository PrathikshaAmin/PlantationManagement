const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  createPlantation,
  getPlantations,
  getPlantationById,
  updatePlantation,
  deletePlantation,
} = require("../controllers/plantationController");
const { saveLocation, getLocation } = require("../controllers/locationController");
const { uploadImages, getImages, deleteImage } = require("../controllers/imageController");
const { getPlantationActivities } = require("../controllers/activityController");

const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const upload = require("../config/multer");

router.use(protect); // every plantation route requires auth

const plantationValidationRules = [
  body("farmer").notEmpty().withMessage("Farmer ID is required").isMongoId(),
  body("plantationName").trim().notEmpty().withMessage("Plantation name is required"),
  body("plantationCode").trim().notEmpty().withMessage("Plantation code is required"),
  body("area").notEmpty().withMessage("Area is required").isFloat({ gt: 0 }),
  body("areaUnit").optional().isIn(["Acres", "Hectares"]),
  body("numberOfPlants").optional().isInt({ min: 0 }),
];

const updateValidationRules = [
  body("plantationName").optional().trim().notEmpty(),
  body("area").optional().isFloat({ gt: 0 }),
  body("areaUnit").optional().isIn(["Acres", "Hectares"]),
];

const locationValidationRules = [
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
];

// Core CRUD
router.get("/", getPlantations);
router.post("/", plantationValidationRules, validate, createPlantation);
router.get("/:id", getPlantationById);
router.put("/:id", updateValidationRules, validate, updatePlantation);
router.delete("/:id", deletePlantation);

// GPS location
router.post("/:id/location", locationValidationRules, validate, saveLocation);
router.get("/:id/location", getLocation);

// Photos
router.post("/:id/images", upload.array("images", 10), uploadImages);
router.get("/:id/images", getImages);

// Activity log
router.get("/:id/activities", getPlantationActivities);

module.exports = router;
