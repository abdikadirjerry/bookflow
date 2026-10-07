const express = require("express");

const {
  createBooking,
  getAvailableSlots,
  getMyBookings,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/available-slots",
  protect,
  authorizeRoles("customer"),
  getAvailableSlots,
);

router.get("/my-bookings", protect, authorizeRoles("customer"), getMyBookings);

router.get(
  "/owner",
  protect,
  authorizeRoles("business_owner"),
  getOwnerBookings,
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("business_owner"),
  updateBookingStatus,
);

router.patch("/:id/cancel", protect, authorizeRoles("customer"), cancelBooking);

router.post("/", protect, authorizeRoles("customer"), createBooking);

module.exports = router;
