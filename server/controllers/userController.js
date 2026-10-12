const Service = require("../models/Service");
const Booking = require("../models/Booking");

const getOwnerCustomers = async (req, res) => {
  try {
    const services = await Service.find({
      owner: req.user.userId,
    }).select("_id");

    const serviceIds = services.map((service) => service._id);

    const bookings = await Booking.find({
      service: { $in: serviceIds },
    })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    const customersMap = new Map();

    for (const booking of bookings) {
      if (!booking.customer) continue;

      const customerId = booking.customer._id.toString();

      if (!customersMap.has(customerId)) {
        customersMap.set(customerId, {
          id: booking.customer._id,
          name: booking.customer.name,
          email: booking.customer.email,
          bookingCount: 0,
        });
      }

      customersMap.get(customerId).bookingCount += 1;
    }

    const customers = Array.from(customersMap.values());

    return res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get owner customers error:", error);

    return res.status(500).json({
      message: "Server error while fetching customers",
    });
  }
};

const getOwnerDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const services = await Service.find({
      owner: ownerId,
    }).select("_id");

    const serviceIds = services.map((service) => service._id);

    const now = new Date();

    const bookingFilter = {
      service: { $in: serviceIds },
    };

    const [
      totalServices,
      activeServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      upcomingBookings,
      uniqueCustomerIds,
    ] = await Promise.all([
      Service.countDocuments({ owner: ownerId }),

      Service.countDocuments({
        owner: ownerId,
        isActive: true,
      }),

      Booking.countDocuments(bookingFilter),

      Booking.countDocuments({
        ...bookingFilter,
        status: "pending",
      }),

      Booking.countDocuments({
        ...bookingFilter,
        status: "confirmed",
      }),

      Booking.countDocuments({
        ...bookingFilter,
        status: "completed",
      }),

      Booking.countDocuments({
        ...bookingFilter,
        status: "cancelled",
      }),

      Booking.countDocuments({
        ...bookingFilter,
        status: "confirmed",
        date: { $gte: now },
      }),

      Booking.distinct("customer", {
        ...bookingFilter,
        customer: { $ne: null },
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalServices,
        activeServices,
        totalCustomers: uniqueCustomerIds.length,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        upcomingBookings,
      },
    });
  } catch (error) {
    console.error("Get owner dashboard stats error:", error);

    return res.status(500).json({
      message: "Server error while fetching dashboard statistics",
    });
  }
};

module.exports = {
  getOwnerCustomers,
  getOwnerDashboardStats,
};
