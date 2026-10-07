const express = require("express");
const { createBooking } = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("customer"), createBooking);

module.exports = router;
