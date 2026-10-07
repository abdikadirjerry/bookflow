const mongoose = require("mongoose");

const dayScheduleSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    startTime: {
      type: String,
      default: null,
    },

    endTime: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const availabilitySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Availability owner is required"],
      unique: true,
    },

    monday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    tuesday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    wednesday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    thursday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    friday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    saturday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },

    sunday: {
      type: dayScheduleSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

availabilitySchema.index({ owner: 1 }, { unique: true });

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
