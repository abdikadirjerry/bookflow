const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service owner is required"],
    },

    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      minlength: [2, "Service name must be at least 2 characters"],
      maxlength: [100, "Service name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
      minlength: [10, "Service description must be at least 10 characters"],
      maxlength: [1000, "Service description cannot exceed 1000 characters"],
    },

    duration: {
      type: Number,
      required: [true, "Service duration is required"],
      min: [1, "Service duration must be at least 1 minute"],
    },

    price: {
      type: Number,
      required: [true, "Service price is required"],
      min: [0, "Service price cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({ owner: 1 });

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
