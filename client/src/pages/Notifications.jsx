import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notificationService";

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const isOwner = user?.role === "business_owner";

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          "Unable to load notifications. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    const notification = notifications.find(
      (item) => item._id === notificationId,
    );

    if (!notification || notification.isRead || processingId) {
      return;
    }

    try {
      setProcessingId(notificationId);

      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update this notification. Please try again.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewBooking = async (notification) => {
    if (!notification.isRead) {
      try {
        setProcessingId(notification._id);

        await markNotificationAsRead(notification._id);

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Unable to mark this notification as read.",
        );
        return;
      } finally {
        setProcessingId(null);
      }
    }

    if (notification.booking?._id) {
      navigate(
        isOwner ? "/owner/bookings" : `/bookings/${notification.booking._id}`,
      );
    } else {
      navigate(isOwner ? "/owner/bookings" : "/bookings");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to={isOwner ? "/dashboard" : "/services"}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back
            </Link>

            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Notifications
            </h1>

            <p className="mt-2 text-slate-600">
              Stay up to date with your booking activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              {unreadCount} unread
            </span>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div
            role="status"
            className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200"
          >
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <span className="text-2xl" aria-hidden="true">
                🔔
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              You're all caught up
            </h2>

            <p className="mt-2 text-slate-600">
              Your notifications will appear here when there is new booking
              activity.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification._id}
                className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
                  notification.isRead ? "ring-slate-200" : "ring-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      notification.isRead ? "bg-slate-300" : "bg-blue-600"
                    }`}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className="font-bold text-slate-900">
                        {notification.title}
                      </h2>

                      {notification.createdAt && (
                        <time
                          dateTime={notification.createdAt}
                          className="shrink-0 text-xs text-slate-500"
                        >
                          {new Date(notification.createdAt).toLocaleString()}
                        </time>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleViewBooking(notification)}
                        disabled={processingId === notification._id}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                      >
                        {processingId === notification._id
                          ? "Updating..."
                          : "View booking"}
                      </button>

                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification._id)}
                          disabled={processingId !== null}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Notifications;
