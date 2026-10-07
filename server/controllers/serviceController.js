const Service = require("../models/Service");

const createService = async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;

    if (
      !name ||
      !description ||
      duration === undefined ||
      price === undefined
    ) {
      return res.status(400).json({
        message: "Name, description, duration, and price are required",
      });
    }

    const service = await Service.create({
      owner: req.user.userId,
      name,
      description,
      duration,
      price,
    });

    res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while creating service",
    });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find({
      isActive: true,
    })
      .populate("owner", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    res.status(500).json({
      message: "Server error while fetching services",
    });
  }
};

module.exports = {
  createService,
  getServices,
};
