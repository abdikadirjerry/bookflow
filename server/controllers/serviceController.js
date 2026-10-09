const mongoose = require("mongoose");
const Service = require("../models/Service");

const createService = async (req, res) => {
  try {
    const { name, description, duration, price, category } = req.body;

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
      ...(category !== undefined && { category }),
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
    console.log("getServices pagination test:", req.query);
    const { page, limit } = req.query;

    // Preserve the existing behavior until the frontend
    // explicitly requests a paginated result.
    const paginationRequested = page !== undefined || limit !== undefined;

    const filter = {
      isActive: true,
    };

    const totalServices = await Service.countDocuments(filter);

    let servicesQuery = Service.find(filter)
      .populate("owner", "name")
      .sort({ createdAt: -1 });

    if (!paginationRequested) {
      const services = await servicesQuery;

      return res.status(200).json({
        count: services.length,
        services,
      });
    }

    const pageNumber = Number(page ?? 1);
    const pageSize = Number(limit ?? 6);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        message:
          "Page must be a positive integer and limit must be an integer between 1 and 100",
      });
    }

    const totalPages = Math.ceil(totalServices / pageSize);

    servicesQuery = servicesQuery
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const services = await servicesQuery;

    res.status(200).json({
      count: totalServices,
      services,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalServices,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("Get services error:", error);

    res.status(500).json({
      message: "Server error while fetching services",
    });
  }
};

const getOwnerServices = async (req, res) => {
  try {
    const services = await Service.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get owner services error:", error);

    res.status(500).json({
      message: "Server error while fetching your services",
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
    const { name, description, duration, price, isActive, category } = req.body;

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
      isActive === undefined &&
      category === undefined
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

    if (category !== undefined) {
      service.category = category;
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
  getOwnerServices,
  getServiceById,
  updateService,
  deleteService,
};
