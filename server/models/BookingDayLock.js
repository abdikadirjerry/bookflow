const mongoose = require("mongoose");

const bookingDayLockSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    lockedUntil: {
      type: Date,
      required: true,
      default: () => new Date(0),
    },
    lockedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

bookingDayLockSchema.index({ owner: 1, date: 1 }, { unique: true });

const BookingDayLock = mongoose.model("BookingDayLock", bookingDayLockSchema);

module.exports = BookingDayLock;
