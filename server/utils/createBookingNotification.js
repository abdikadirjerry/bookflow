const Notification = require("../models/Notification");

const createBookingNotification = async ({
  recipient,
  booking,
  type,
  title,
  message,
}) => {
  try {
    await Notification.create({
      recipient,
      booking,
      type,
      title,
      message,
    });

    return true;
  } catch (error) {
    // Notification failures must not undo a successful booking operation.
    console.error("Create booking notification error:", error.message);
    return false;
  }
};

module.exports = createBookingNotification;
