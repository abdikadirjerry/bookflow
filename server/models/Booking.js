const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booking customer is required"],
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Booking service is required"],
    },

    date: {
      type: String,
      required: [true, "Booking date is required"],
    },

    startTime: {
      type: String,
      required: [true, "Booking start time is required"],
    },

    endTime: {
      type: String,
      required: [true, "Booking end time is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "completed", "cancelled"],
        message: "Status must be pending, confirmed, completed, or cancelled",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ customer: 1 });
bookingSchema.index({ service: 1 });
bookingSchema.index({ date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
