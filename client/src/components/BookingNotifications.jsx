import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notificationService";

function getNotificationStyle(type) {
  switch (type) {
    case "booking_confirmed":
      return {
        style: "border-blue-200 bg-blue-50 text-blue-900",
        icon: "✓",
      };

    case "booking_cancelled":
      return {
        style: "border-red-200 bg-red-50 text-red-900",
        icon: "!",
      };

    case "booking_completed":
      return {
        style: "border-green-200 bg-green-50 text-green-900",
        icon: "✓",
      };

    default:
      return {
        style: "border-slate-200 bg-slate-50 text-slate-900",
        icon: "i",
      };
  }
}

function formatNotificationDate(date) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function BookingNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setError("");

      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : (data.notifications || []).filter(
              (notification) => !notification.isRead,
            ).length,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load booking updates. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkAsRead(notificationId) {
    const notification = notifications.find(
      (item) => item._id === notificationId,
    );

    if (!notification || notification.isRead) {
      return;
    }

    try {
      setMarkingId(notificationId);
      setError("");

      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update this notification. Please try again.",
      );
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead,
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    setMarkingAll(true);
    setError("");

    try {
      // Update each unread notification through the protected API.
      const results = await Promise.allSettled(
        unreadNotifications.map((notification) =>
          markNotificationAsRead(notification._id),
        ),
      );

      const successfulIds = new Set(
        unreadNotifications
          .filter((_, index) => results[index].status === "fulfilled")
          .map((notification) => notification._id),
      );

      setNotifications((current) =>
        current.map((notification) =>
          successfulIds.has(notification._id)
            ? { ...notification, isRead: true }
            : notification,
        ),
      );

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      setUnreadCount((current) => Math.max(0, current - successfulIds.size));

      if (failedCount > 0) {
        setError(
          `${failedCount} notification(s) could not be marked as read. Please try again.`,
        );
      }
    } finally {
      setMarkingAll(false);
    }
  }

  if (isLoading) {
    return (
      <section
        aria-labelledby="booking-notifications-heading"
        className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
        <h2
          id="booking-notifications-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Booking updates
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Loading your notifications...
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="booking-notifications-heading" className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="booking-notifications-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Booking updates
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {unreadCount} unread{" "}
            {unreadCount === 1 ? "notification" : "notifications"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={loadNotifications}
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingAll ? "Updating..." : "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="mt-2 font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {!error && notifications.length === 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="font-medium text-slate-900">You’re all caught up</p>
          <p className="mt-1 text-sm text-slate-600">
            Booking updates will appear here when something changes.
          </p>
        </div>
      )}

      {notifications.length > 0 && (
        <>
          <div className="space-y-3">
            {(showAll ? notifications : notifications.slice(0, 3)).map(
              (notification) => {
                const { style, icon } = getNotificationStyle(notification.type);

                const bookingId =
                  notification.booking?._id || notification.booking;

                const isMarking = markingId === notification._id;

                return (
                  <article
                    key={notification._id}
                    className={`flex items-start gap-3 rounded-xl border p-4 ${style} ${
                      notification.isRead ? "opacity-75" : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 font-bold"
                    >
                      {icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>

                        {!notification.isRead && (
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm">{notification.message}</p>

                      {notification.createdAt && (
                        <p className="mt-2 text-xs opacity-75">
                          {formatNotificationDate(notification.createdAt)}
                        </p>
                      )}

                      {bookingId && (
                        <Link
                          to={`/bookings/${bookingId}`}
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification._id);
                            }
                          }}
                          className="mt-2 inline-block text-sm font-semibold underline underline-offset-4 hover:opacity-80"
                        >
                          View booking
                        </Link>
                      )}
                    </div>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={isMarking || markingAll}
                        className="shrink-0 rounded px-2 py-1 text-sm font-medium hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isMarking ? "Updating..." : "Mark read"}
                      </button>
                    )}
                  </article>
                );
              },
            )}
          </div>

          {notifications.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              {showAll
                ? "Show fewer updates"
                : `Show all ${notifications.length} notifications`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
