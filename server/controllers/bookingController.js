const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Availability = require("../models/Availability");

const createBooking = async (req, res) => {
  try {
    const { serviceId, date, startTime } = req.body;

    if (!serviceId || !date || !startTime) {
      return res.status(400).json({
        message: "Service, date, and start time are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found or is inactive",
      });
    }

    const availability = await Availability.findOne({
      owner: service.owner,
    });

    if (!availability) {
      return res.status(400).json({
        message: "This business has not configured its availability",
      });
    }

    const startTimeParts = startTime.split(":");

    if (
      startTimeParts.length !== 2 ||
      !/^\d{2}$/.test(startTimeParts[0]) ||
      !/^\d{2}$/.test(startTimeParts[1])
    ) {
      return res.status(400).json({
        message: "Start time must use HH:MM format",
      });
    }

    const startHour = Number(startTimeParts[0]);
    const startMinute = Number(startTimeParts[1]);

    if (
      startHour < 0 ||
      startHour > 23 ||
      startMinute < 0 ||
      startMinute > 59
    ) {
      return res.status(400).json({
        message: "Start time must be a valid time",
      });
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(date)) {
      return res.status(400).json({
        message: "Date must use YYYY-MM-DD format",
      });
    }

    const [year, month, day] = date.split("-").map(Number);

    const dateObject = new Date(year, month - 1, day);

    if (
      dateObject.getFullYear() !== year ||
      dateObject.getMonth() !== month - 1 ||
      dateObject.getDate() !== day
    ) {
      return res.status(400).json({
        message: "Date must be a valid calendar date",
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateObject < today) {
      return res.status(400).json({
        message: "Booking date cannot be in the past",
      });
    }

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const dayName = dayNames[dateObject.getDay()];
    const dayAvailability = availability[dayName];

    if (!dayAvailability || !dayAvailability.enabled) {
      return res.status(400).json({
        message: `The business is closed on ${dayName}`,
      });
    }

    const availabilityStartParts = dayAvailability.startTime.split(":");

    const availabilityEndParts = dayAvailability.endTime.split(":");

    const availabilityStartMinutes =
      Number(availabilityStartParts[0]) * 60 +
      Number(availabilityStartParts[1]);

    const availabilityEndMinutes =
      Number(availabilityEndParts[0]) * 60 + Number(availabilityEndParts[1]);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + service.duration;

    if (startMinutes < availabilityStartMinutes) {
      return res.status(400).json({
        message: `The business opens at ${dayAvailability.startTime}`,
      });
    }

    if (endMinutes > availabilityEndMinutes) {
      return res.status(400).json({
        message: `The booking must finish by ${dayAvailability.endTime}`,
      });
    }

    if (endMinutes > 24 * 60) {
      return res.status(400).json({
        message: "Booking cannot extend past midnight",
      });
    }

    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;

    const endTime = `${String(endHour).padStart(2, "0")}:${String(
      endMinute,
    ).padStart(2, "0")}`;

    const overlappingBooking = await Booking.findOne({
      service: serviceId,
      date,
      status: {
        $in: ["pending", "confirmed"],
      },
      startTime: {
        $lt: endTime,
      },
      endTime: {
        $gt: startTime,
      },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: "This time slot is already booked",
      });
    }

    const booking = await Booking.create({
      customer: req.user.userId,
      service: serviceId,
      date,
      startTime,
      endTime,
      status: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email")
      .populate("service", "name description duration price");

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while creating booking",
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: req.user.userId,
    })
      .populate("service", "name description duration price")
      .sort({
        date: 1,
        startTime: 1,
      });

    res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    res.status(500).json({
      message: "Server error while fetching bookings",
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.customer.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You do not have permission to cancel this booking",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking cannot be cancelled because its status is ${booking.status}`,
      });
    }

    booking.status = "cancelled";

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id).populate(
      "service",
      "name description duration price",
    );

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    res.status(500).json({
      message: "Server error while cancelling booking",
    });
  }
};

const getOwnerBookings = async (req, res) => {
  try {
    const services = await Service.find({
      owner: req.user.userId,
    }).select("_id");

    const serviceIds = services.map((service) => service._id);

    const bookings = await Booking.find({
      service: {
        $in: serviceIds,
      },
    })
      .populate("customer", "name email")
      .populate("service", "name description duration price")
      .sort({
        date: 1,
        startTime: 1,
      });

    res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get owner bookings error:", error);

    res.status(500).json({
      message: "Server error while fetching bookings",
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (!status) {
      return res.status(400).json({
        message: "Booking status is required",
      });
    }

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be pending, confirmed, completed, or cancelled",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const service = await Service.findOne({
      _id: booking.service,
      owner: req.user.userId,
    });

    if (!service) {
      return res.status(403).json({
        message: "You do not have permission to update this booking",
      });
    }

    const allowedTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change booking status from ${booking.status} to ${status}`,
      });
    }

    booking.status = status;

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email")
      .populate("service", "name description duration price");

    res.status(200).json({
      message: "Booking status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while updating booking status",
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
};
