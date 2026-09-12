const express = require("express");
const router = express.Router();

const { deleteImage } = require("../controllers/imageController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.delete("/:imageId", deleteImage);

module.exports = router;
