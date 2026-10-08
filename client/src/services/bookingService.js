import api from "./api";

const getAvailableSlots = async (serviceId, date) => {
  const response = await api.get("/bookings/available-slots", {
    params: {
      serviceId,
      date,
    },
  });

  return response.data;
};

const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);

  return response.data;
};

const getMyBookings = async () => {
  const response = await api.get("/bookings/my-bookings");

  return response.data;
};

const cancelBooking = async (bookingId) => {
  const response = await api.patch(`/bookings/${bookingId}/cancel`);

  return response.data;
};

export { getAvailableSlots, createBooking, getMyBookings, cancelBooking };
