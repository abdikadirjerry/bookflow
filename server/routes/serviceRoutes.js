const express = require("express");
const {
  createService,
  getServices,
} = require("../controllers/serviceController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getServices);

router.post("/", protect, authorizeRoles("business_owner"), createService);

module.exports = router;
