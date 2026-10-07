const express = require("express");
const {
  getAvailability,
  updateAvailability,
} = require("../controllers/availabilityController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, authorizeRoles("business_owner"), getAvailability);

router.put("/", protect, authorizeRoles("business_owner"), updateAvailability);

module.exports = router;
