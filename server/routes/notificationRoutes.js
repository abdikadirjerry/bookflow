const express = require("express");

const {
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);

module.exports = router;
