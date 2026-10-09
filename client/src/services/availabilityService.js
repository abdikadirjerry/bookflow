import api from "./api";

const getAvailability = async () => {
  const response = await api.get("/availability");

  return response.data;
};

const updateAvailability = async (availabilityData) => {
  const response = await api.put("/availability", availabilityData);

  return response.data;
};

export { getAvailability, updateAvailability };
