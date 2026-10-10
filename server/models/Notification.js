const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"],
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Notification booking is required"],
    },

    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: [
          "booking_created",
          "booking_confirmed",
          "booking_completed",
          "booking_cancelled",
        ],
        message: "Invalid notification type",
      },
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [100, "Notification title cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Notification message cannot exceed 500 characters"],
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Retrieve a user's newest notifications efficiently.
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Retrieve unread notifications efficiently.
notificationSchema.index({ recipient: 1, isRead: 1 });

// Prevent the same event notification from being created twice
// for the same recipient and booking.
notificationSchema.index(
  { recipient: 1, booking: 1, type: 1 },
  { unique: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
