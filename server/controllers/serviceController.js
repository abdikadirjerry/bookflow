const mongoose = require("mongoose");
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

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("owner", "name");

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.status(200).json({
      service,
    });
  } catch (error) {
    console.error("Get service by ID error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.status(500).json({
      message: "Server error while fetching service",
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { name, description, duration, price, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    if (service.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You do not have permission to update this service",
      });
    }

    if (
      name === undefined &&
      description === undefined &&
      duration === undefined &&
      price === undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update the service",
      });
    }

    if (name !== undefined) {
      service.name = name;
    }

    if (description !== undefined) {
      service.description = description;
    }

    if (duration !== undefined) {
      service.duration = duration;
    }

    if (price !== undefined) {
      service.price = price;
    }

    if (isActive !== undefined) {
      service.isActive = isActive;
    }

    await service.save();

    res.status(200).json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while updating service",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    if (service.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You do not have permission to delete this service",
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        message: "Service is already inactive",
      });
    }

    service.isActive = false;

    await service.save();

    res.status(200).json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    res.status(500).json({
      message: "Server error while deleting service",
    });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
};
