import api from "./api";

const getServices = async () => {
  const response = await api.get("/services");

  return response.data;
};

export { getServices };
