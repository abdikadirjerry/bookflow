import api from "./api";

const getServices = async () => {
  const response = await api.get("/services");

  return response.data;
};

const getServiceById = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);

  return response.data;
};

const createService = async (serviceData) => {
  const response = await api.post("/services", serviceData);

  return response.data;
};

const updateService = async (serviceId, serviceData) => {
  const response = await api.put(`/services/${serviceId}`, serviceData);

  return response.data;
};

const deleteService = async (serviceId) => {
  const response = await api.delete(`/services/${serviceId}`);

  return response.data;
};

export {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
