import api from "./api";

const getOwnerCustomers = async () => {
  const response = await api.get("/users/customers");

  return response.data;
};

const getOwnerDashboardStats = async () => {
  const response = await api.get("/users/dashboard-stats");

  return response.data;
};

export { getOwnerCustomers, getOwnerDashboardStats };
