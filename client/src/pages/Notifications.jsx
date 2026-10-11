import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const isOwner = user?.role === "business_owner";

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getNotifications();
      const items = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      setNotifications(items);
      setUnreadCount(
        typeof data?.unreadCount === "number"
          ? Math.max(0, data.unreadCount)
          : items.filter((item) => !item.isRead).length,
      );
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

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(
      (item) => item._id === notificationId,
    );

    if (!notification || notification.isRead || processingId || isMarkingAll) {
      return true;
    }

    setError("");

    try {
      setProcessingId(notificationId);
      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("bookflow:notifications-updated"));

      return true;
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update this notification. Please try again.",
      );
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleViewBooking = async (notification) => {
    if (processingId || isMarkingAll) return;

    if (!notification.isRead) {
      const success = await markAsRead(notification._id);
      if (!success) return;
    }

    if (notification.booking?._id) {
      navigate(
        isOwner ? "/owner/bookings" : `/bookings/${notification.booking._id}`,
      );
    } else {
      navigate(isOwner ? "/owner/bookings" : "/bookings");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.isRead);

    if (unreadNotifications.length === 0 || processingId || isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);
    setError("");

    try {
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification._id);
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);

      window.dispatchEvent(new Event("bookflow:notifications-updated"));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Some notifications could not be marked as read. Refresh to check their status.",
      );

      await loadNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications
      .filter((notification) => {
        if (filter === "unread" && notification.isRead) return false;
        if (filter === "read" && !notification.isRead) return false;

        if (!query) return true;

        return [notification.title, notification.message]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime() || 0;
        const dateB = new Date(b.createdAt || 0).getTime() || 0;

        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [notifications, search, filter, sortOrder]);

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

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              {unreadCount} unread
            </span>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={isLoading || isMarkingAll}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={
                unreadCount === 0 ||
                isLoading ||
                isMarkingAll ||
                processingId !== null
              }
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMarkingAll ? "Marking..." : "Mark all as read"}
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

        <section
          aria-label="Notification filters"
          className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3"
        >
          <div className="sm:col-span-3">
            <label
              htmlFor="notification-search"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Search notifications
            </label>
            <input
              id="notification-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles or messages..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="notification-filter"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Read status
            </label>
            <select
              id="notification-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notification-sort"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Sort by date
            </label>
            <select
              id="notification-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
                setSortOrder("newest");
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear filters
            </button>
          </div>
        </section>

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
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              No matching notifications
            </h2>
            <p className="mt-2 text-slate-600">
              Try another search term or change your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
                setSortOrder("newest");
              }}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              Showing {filteredNotifications.length} of {notifications.length}{" "}
              notifications
            </p>

            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
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
                          disabled={processingId !== null || isMarkingAll}
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
                            disabled={processingId !== null || isMarkingAll}
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
          </>
        )}
      </div>
    </main>
  );
}

export default Notifications;
