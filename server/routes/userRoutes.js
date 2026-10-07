const express = require("express");
const {
  getOwnerCustomers,
  getOwnerDashboardStats,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/customers",
  protect,
  authorizeRoles("business_owner"),
  getOwnerCustomers,
);

router.get(
  "/dashboard-stats",
  protect,
  authorizeRoles("business_owner"),
  getOwnerDashboardStats,
);

module.exports = router;
