const Availability = require("../models/Availability");

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const validateDaySchedule = (dayName, schedule) => {
  if (!schedule || typeof schedule !== "object") {
    return `${dayName} schedule must be an object`;
  }

  const { enabled, startTime, endTime } = schedule;

  if (typeof enabled !== "boolean") {
    return `${dayName}.enabled must be true or false`;
  }

  if (!enabled) {
    return null;
  }

  if (!startTime || !endTime) {
    return `${dayName} requires startTime and endTime when enabled`;
  }

  if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
    return `${dayName} times must use HH:MM format`;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes >= endMinutes) {
    return `${dayName} startTime must be earlier than endTime`;
  }

  return null;
};

const validateAvailability = (availability) => {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  for (const day of days) {
    const error = validateDaySchedule(day, availability[day]);

    if (error) {
      return error;
    }
  }

  return null;
};

const getAvailability = async (req, res) => {
  try {
    let availability = await Availability.findOne({
      owner: req.user.userId,
    });

    if (!availability) {
      availability = await Availability.create({
        owner: req.user.userId,
      });
    }

    res.status(200).json({
      availability,
    });
  } catch (error) {
    console.error("Get availability error:", error);

    res.status(500).json({
      message: "Server error while fetching availability",
    });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
      req.body;

    const availabilityData = {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    };

    const validationError = validateAvailability(availabilityData);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const availability = await Availability.findOneAndUpdate(
      {
        owner: req.user.userId,
      },
      {
        owner: req.user.userId,
        ...availabilityData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Update availability error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while updating availability",
    });
  }
};

module.exports = {
  getAvailability,
  updateAvailability,
};
