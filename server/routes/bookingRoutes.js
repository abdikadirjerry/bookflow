const express = require("express");
const {
  createBooking,
  getMyBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/my-bookings", protect, authorizeRoles("customer"), getMyBookings);

router.patch("/:id/cancel", protect, authorizeRoles("customer"), cancelBooking);

router.post("/", protect, authorizeRoles("customer"), createBooking);

module.exports = router;
