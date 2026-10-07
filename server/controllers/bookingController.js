const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");

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

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + service.duration;

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

module.exports = {
  createBooking,
  getMyBookings,
};
