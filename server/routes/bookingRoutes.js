const express = require("express");
const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/my-bookings", protect, authorizeRoles("customer"), getMyBookings);

router.post("/", protect, authorizeRoles("customer"), createBooking);

module.exports = router;
