const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, (req, res) => {
  res.status(200).json({
    message: "You accessed a protected route",
    user: req.user,
  });
});

router.get("/owner", protect, authorizeRoles("business_owner"), (req, res) => {
  res.status(200).json({
    message: "You accessed a business owner route",
    user: req.user,
  });
});

router.get("/customer", protect, authorizeRoles("customer"), (req, res) => {
  res.status(200).json({
    message: "You accessed a customer route",
    user: req.user,
  });
});

module.exports = router;
