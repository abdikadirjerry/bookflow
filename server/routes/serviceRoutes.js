const express = require("express");
const {
  createService,
  getServices,
  getServiceById,
} = require("../controllers/serviceController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getServices);

router.get("/:id", getServiceById);

router.post("/", protect, authorizeRoles("business_owner"), createService);

module.exports = router;
