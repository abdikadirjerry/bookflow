const Service = require("../models/Service");
const Booking = require("../models/Booking");

const getOwnerCustomers = async (req, res) => {
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
      .sort({
        createdAt: -1,
      });

    const customersMap = new Map();

    for (const booking of bookings) {
      if (!booking.customer) {
        continue;
      }

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

    res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get owner customers error:", error);

    res.status(500).json({
      message: "Server error while fetching customers",
    });
  }
};

const getOwnerDashboardStats = async (req, res) => {
  try {
    const services = await Service.find({
      owner: req.user.userId,
    }).select("_id");

    const serviceIds = services.map((service) => service._id);

    const [
      totalServices,
      activeServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
    ] = await Promise.all([
      Service.countDocuments({
        owner: req.user.userId,
      }),

      Service.countDocuments({
        owner: req.user.userId,
        isActive: true,
      }),

      Booking.countDocuments({
        service: {
          $in: serviceIds,
        },
      }),

      Booking.countDocuments({
        service: {
          $in: serviceIds,
        },
        status: "pending",
      }),

      Booking.countDocuments({
        service: {
          $in: serviceIds,
        },
        status: "confirmed",
      }),

      Booking.countDocuments({
        service: {
          $in: serviceIds,
        },
        status: "completed",
      }),

      Booking.countDocuments({
        service: {
          $in: serviceIds,
        },
        status: "cancelled",
      }),
    ]);

    const uniqueCustomerIds = await Booking.distinct("customer", {
      service: {
        $in: serviceIds,
      },
    });

    res.status(200).json({
      stats: {
        totalServices,
        activeServices,
        totalCustomers: uniqueCustomerIds.length,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
      },
    });
  } catch (error) {
    console.error("Get owner dashboard stats error:", error);

    res.status(500).json({
      message: "Server error while fetching dashboard statistics",
    });
  }
};

module.exports = {
  getOwnerCustomers,
  getOwnerDashboardStats,
};
