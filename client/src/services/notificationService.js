import api from "./api";

const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);

  return response.data;
};

export { getNotifications, markNotificationAsRead };
