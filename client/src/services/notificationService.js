import api from "./api";

const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bookflow:notifications-updated"));
  }

  return response.data;
};

export { getNotifications, markNotificationAsRead };
