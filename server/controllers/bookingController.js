const mongoose = require("mongoose");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const BookingDayLock = require("../models/BookingDayLock");
const Service = require("../models/Service");
const Availability = require("../models/Availability");

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0",
  )}`;
};

const acquireBookingDayLock = async (ownerId, date) => {
  // Create the lock document once. The unique owner/date index handles
  // simultaneous attempts to initialize the same lock.
  try {
    await BookingDayLock.updateOne(
      { owner: ownerId, date },
      {
        $setOnInsert: {
          owner: ownerId,
          date,
          lockedUntil: new Date(0),
          lockedBy: null,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  const lockToken = crypto.randomUUID();
  const waitUntil = Date.now() + 15000;
  const lockDurationMs = 5 * 60 * 1000;

  while (Date.now() < waitUntil) {
    const now = new Date();
    const lock = await BookingDayLock.findOneAndUpdate(
      {
        owner: ownerId,
        date,
        lockedUntil: { $lte: now },
      },
      {
        $set: {
          lockedUntil: new Date(now.getTime() + lockDurationMs),
          lockedBy: lockToken,
        },
      },
      { new: true },
    );

    if (lock) {
      return lockToken;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const error = new Error("Booking is busy. Please try again.");
  error.code = "BOOKING_LOCK_TIMEOUT";
  throw error;
};

const releaseBookingDayLock = async (ownerId, date, lockToken) => {
  await BookingDayLock.updateOne(
    {
      owner: ownerId,
      date,
      lockedBy: lockToken,
    },
    {
      $set: {
        lockedUntil: new Date(0),
        lockedBy: null,
      },
    },
  );
};

const createBooking = async (req, res) => {
  let bookingLockOwnerId = null;
  let bookingLockDate = null;
  let bookingLockToken = null;

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

    const availabilityStartMinutes = timeToMinutes(dayAvailability.startTime);

    const availabilityEndMinutes = timeToMinutes(dayAvailability.endTime);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + service.duration;

    // NEW: Reject booking times that have already arrived or passed today.
    if (
      dateObject.getTime() === today.getTime() &&
      startMinutes <= now.getHours() * 60 + now.getMinutes()
    ) {
      return res.status(400).json({
        message: "Booking time must be in the future",
      });
    }

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

    const endTime = minutesToTime(endMinutes);

    // Serialize booking creation for this provider and date. This prevents
    // two concurrent requests from both passing the overlap check.
    bookingLockOwnerId = service.owner;
    bookingLockDate = date;
    bookingLockToken = await acquireBookingDayLock(
      bookingLockOwnerId,
      bookingLockDate,
    );

    // A provider can offer multiple services, but cannot serve two customers
    // at overlapping times. Check bookings across all of this provider's services.
    const providerServices = await Service.find({
      owner: service.owner,
    }).select("_id");
    const providerServiceIds = providerServices.map(
      (providerService) => providerService._id,
    );

    const overlappingBooking = await Booking.findOne({
      service: { $in: providerServiceIds },
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

    if (error.code === "BOOKING_LOCK_TIMEOUT") {
      return res.status(503).json({
        message: "Booking is busy. Please try again.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while creating booking",
    });
  } finally {
    if (bookingLockOwnerId && bookingLockDate && bookingLockToken) {
      try {
        await releaseBookingDayLock(
          bookingLockOwnerId,
          bookingLockDate,
          bookingLockToken,
        );
      } catch (releaseError) {
        console.error("Release booking lock error:", releaseError);
      }
    }
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({
        message: "Service ID and date are required",
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
        message: "Date cannot be in the past",
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
      return res.status(200).json({
        date,
        service: {
          id: service._id,
          name: service.name,
          duration: service.duration,
        },
        slots: [],
      });
    }

    if (
      !timePattern.test(dayAvailability.startTime) ||
      !timePattern.test(dayAvailability.endTime)
    ) {
      return res.status(500).json({
        message: "Business availability contains invalid time data",
      });
    }

    const businessStartMinutes = timeToMinutes(dayAvailability.startTime);

    const businessEndMinutes = timeToMinutes(dayAvailability.endTime);

    const providerServices = await Service.find({
      owner: service.owner,
    }).select("_id");
    const providerServiceIds = providerServices.map(
      (providerService) => providerService._id,
    );

    const bookings = await Booking.find({
      service: { $in: providerServiceIds },
      date,
      status: {
        $in: ["pending", "confirmed"],
      },
    }).select("startTime endTime");

    const slots = [];

    // NEW: Capture the current time in minutes since midnight.
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = dateObject.getTime() === today.getTime();

    for (
      let startMinutes = businessStartMinutes;
      startMinutes + service.duration <= businessEndMinutes;
      startMinutes += service.duration
    ) {
      // NEW: Do not return slots whose start time has arrived or passed.
      if (isToday && startMinutes <= currentMinutes) {
        continue;
      }

      const endMinutes = startMinutes + service.duration;

      const startTime = minutesToTime(startMinutes);
      const endTime = minutesToTime(endMinutes);

      const isBooked = bookings.some((booking) => {
        return booking.startTime < endTime && booking.endTime > startTime;
      });

      slots.push({
        startTime,
        endTime,
        available: !isBooked,
      });
    }

    res.status(200).json({
      date,
      service: {
        id: service._id,
        name: service.name,
        duration: service.duration,
      },
      businessHours: {
        startTime: dayAvailability.startTime,
        endTime: dayAvailability.endTime,
      },
      slots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);

    res.status(500).json({
      message: "Server error while fetching available slots",
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
  getAvailableSlots,
  getMyBookings,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
};
