import api from "./api";

const getOwnerDashboardStats = async () => {
  const response = await api.get("/users/dashboard-stats");

  return response.data;
};

const getOwnerCustomers = async () => {
  const response = await api.get("/users/customers");

  return response.data;
};

export { getOwnerDashboardStats, getOwnerCustomers };
