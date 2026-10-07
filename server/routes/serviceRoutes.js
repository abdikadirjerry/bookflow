const express = require("express");
const {
  createService,
  getServices,
  getServiceById,
  updateService,
} = require("../controllers/serviceController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getServices);

router.get("/:id", getServiceById);

router.post("/", protect, authorizeRoles("business_owner"), createService);

router.put("/:id", protect, authorizeRoles("business_owner"), updateService);

module.exports = router;
