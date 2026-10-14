
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notificationService";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageHeader from "../components/ui/PageHeader";

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

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const processingIdRef = useRef(null);
  const markingAllRef = useRef(false);

  const isOwner = user?.role === "business_owner";

  const loadNotifications = useCallback(async () => {
    if (processingIdRef.current || markingAllRef.current) return;

    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError("");

    try {
      const data = await getNotifications();
      const items = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setNotifications(items);
      setUnreadCount(
        typeof data?.unreadCount === "number"
          ? Math.max(0, data.unreadCount)
          : items.filter((item) => !item.isRead).length,
      );
    } catch (fetchError) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        fetchError.response?.data?.message ||
          "Unable to load notifications. Please try again.",
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadNotifications();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadNotifications]);

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(
      (item) => item._id === notificationId,
    );

    if (
      !notification ||
      notification.isRead ||
      processingIdRef.current ||
      markingAllRef.current
    ) {
      return Boolean(notification?.isRead);
    }

    processingIdRef.current = notificationId;
    requestIdRef.current += 1;

    setProcessingId(notificationId);
    setError("");
    setIsLoading(false);

    try {
      await markNotificationAsRead(notificationId);

      if (!mountedRef.current) return false;

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));

      window.dispatchEvent(
        new Event("bookflow:notifications-updated"),
      );

      return true;
    } catch (requestError) {
      if (mountedRef.current) {
        setError(
          requestError.response?.data?.message ||
            "Unable to update this notification. Please try again.",
        );
      }

      return false;
    } finally {
      processingIdRef.current = null;

      if (mountedRef.current) {
        setProcessingId(null);
      }
    }
  };

  const handleViewBooking = async (notification) => {
    if (processingIdRef.current || markingAllRef.current) return;

    if (!notification.isRead) {
      const success = await markAsRead(notification._id);
      if (!success) return;
    }

    if (!mountedRef.current) return;

    if (notification.booking?._id) {
      navigate(
        isOwner
          ? "/owner/bookings"
          : `/bookings/${notification.booking._id}`,
      );
    } else {
      navigate(isOwner ? "/owner/bookings" : "/bookings");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (item) => !item.isRead,
    );

    if (
      unreadNotifications.length === 0 ||
      processingIdRef.current ||
      markingAllRef.current
    ) {
      return;
    }

    markingAllRef.current = true;
    requestIdRef.current += 1;

    setIsMarkingAll(true);
    setIsLoading(false);
    setError("");

    let failed = false;

    try {
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification._id);
      }

      if (!mountedRef.current) return;

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);

      window.dispatchEvent(
        new Event("bookflow:notifications-updated"),
      );
    } catch (requestError) {
      failed = true;

      if (mountedRef.current) {
        setError(
          requestError.response?.data?.message ||
            "Some notifications could not be marked as read. Refresh to check their status.",
        );
      }
    } finally {
      markingAllRef.current = false;

      if (mountedRef.current) {
        setIsMarkingAll(false);
      }

      if (failed && mountedRef.current) {
        await loadNotifications();
      }
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
          .some((value) =>
            String(value).toLowerCase().includes(query),
          );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime() || 0;
        const dateB = new Date(b.createdAt || 0).getTime() || 0;

        return sortOrder === "newest"
          ? dateB - dateA
          : dateA - dateB;
      });
  }, [notifications, search, filter, sortOrder]);

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    filter !== "all" ||
    sortOrder !== "newest";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to={isOwner ? "/dashboard" : "/services"}
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          ← Back
        </Link>

        <div className="mt-5">
          <PageHeader
            eyebrow="Updates"
            title="Notifications"
            description="Stay up to date with your booking activity."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {unreadCount} unread
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadNotifications}
                  disabled={isLoading || isMarkingAll || processingId !== null}
                >
                  {isLoading ? "Loading..." : "Refresh"}
                </Button>

                <Button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={
                    unreadCount === 0 ||
                    isLoading ||
                    isMarkingAll ||
                    processingId !== null
                  }
                >
                  {isMarkingAll ? "Marking..." : "Mark all as read"}
                </Button>
              </div>
            }
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100"
          >
            <p>{error}</p>
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={loadNotifications}
                disabled={isLoading || isMarkingAll || processingId !== null}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <Card>
            <section
              aria-label="Notification filters"
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label
                  htmlFor="notification-search"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Search notifications
                </label>

                <Input
                  id="notification-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search titles or messages..."
                />
              </div>

              <div>
                <label
                  htmlFor="notification-filter"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Read status
                </label>

                <select
                  id="notification-filter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="all">All notifications</option>
                  <option value="unread">Unread only</option>
                  <option value="read">Read only</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="notification-sort"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Sort by date
                </label>

                <select
                  id="notification-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              {hasActiveFilters && (
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </section>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <div
              role="status"
              aria-live="polite"
              className="py-8 text-center text-slate-600"
            >
              Loading notifications...
            </div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="py-6 text-center">
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
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <div className="py-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                No matching notifications
              </h2>

              <p className="mt-2 text-slate-600">
                Try another search term or change your filters.
              </p>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500" aria-live="polite">
              Showing {filteredNotifications.length} of {notifications.length}{" "}
              notifications
            </p>

            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification._id}>
                  <article
                    className={`border-l-4 pl-4 ${
                      notification.isRead
                        ? "border-slate-200"
                        : "border-blue-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.isRead
                            ? "bg-slate-300"
                            : "bg-blue-600"
                        }`}
                        aria-hidden="true"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <h2 className="font-bold text-slate-900">
                            {notification.title || "Notification"}
                          </h2>

                          {notification.createdAt && (
                            <time
                              dateTime={notification.createdAt}
                              className="shrink-0 text-xs text-slate-500"
                            >
                              {new Date(
                                notification.createdAt,
                              ).toLocaleString()}
                            </time>
                          )}
                        </div>

                        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                          {notification.message || "No additional details."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={() => handleViewBooking(notification)}
                            disabled={
                              processingId !== null || isMarkingAll
                            }
                          >
                            {processingId === notification._id
                              ? "Updating..."
                              : "View booking"}
                          </Button>

                          {!notification.isRead && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => markAsRead(notification._id)}
                              disabled={
                                processingId !== null || isMarkingAll
                              }
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Notifications;
