const express = require("express");
const { getOwnerCustomers } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/customers",
  protect,
  authorizeRoles("business_owner"),
  getOwnerCustomers,
);

module.exports = router;
