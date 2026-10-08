import api from "./api";

const getServices = async () => {
  const response = await api.get("/services");

  return response.data;
};

const getServiceById = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);

  return response.data;
};

export { getServices, getServiceById };
