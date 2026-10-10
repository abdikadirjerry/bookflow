import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DISMISSED_KEY = "bookflow-dismissed-booking-notifications";

function getBookingId(booking) {
  return booking?._id || booking?.id || "";
}

function getServiceName(booking) {
  return booking?.service?.name || booking?.service?.title || "Your service";
}

function getNotification(booking) {
  const status = String(booking?.status || "").toLowerCase();

  if (status === "confirmed") {
    return {
      title: "Booking confirmed",
      message: `${getServiceName(booking)} has been confirmed.`,
      style: "border-blue-200 bg-blue-50 text-blue-900",
      icon: "✓",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Booking cancelled",
      message: `${getServiceName(booking)} will not go ahead as planned.`,
      style: "border-red-200 bg-red-50 text-red-900",
      icon: "!",
    };
  }

  if (status === "completed") {
    return {
      title: "Booking completed",
      message: `${getServiceName(booking)} is marked as completed.`,
      style: "border-green-200 bg-green-50 text-green-900",
      icon: "✓",
    };
  }

  return null;
}

function readDismissedNotifications() {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function BookingNotifications({ bookings = [] }) {
  const [dismissedIds, setDismissedIds] = useState(readDismissedNotifications);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds));
    } catch {
      // Notifications still work for this session if storage is unavailable.
    }
  }, [dismissedIds]);

  const notifications = useMemo(() => {
    return bookings
      .map((booking) => {
        const bookingId = getBookingId(booking);
        const notification = getNotification(booking);

        if (!bookingId || !notification) {
          return null;
        }

        return {
          id: `${bookingId}:${String(booking.status).toLowerCase()}`,
          bookingId,
          ...notification,
        };
      })
      .filter(Boolean)
      .filter((notification) => !dismissedIds.includes(notification.id))
      .reverse();
  }, [bookings, dismissedIds]);

  if (notifications.length === 0) {
    return null;
  }

  const visibleNotifications = showAll
    ? notifications
    : notifications.slice(0, 3);

  function dismissNotification(notificationId) {
    setDismissedIds((current) =>
      current.includes(notificationId) ? current : [...current, notificationId],
    );
  }

  function dismissAll() {
    setDismissedIds((current) => [
      ...new Set([
        ...current,
        ...notifications.map((notification) => notification.id),
      ]),
    ]);
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
            {notifications.length}{" "}
            {notifications.length === 1 ? "update" : "updates"} to review
          </p>
        </div>

        <button
          type="button"
          onClick={dismissAll}
          className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
        >
          Dismiss all
        </button>
      </div>

      <div className="space-y-3">
        {visibleNotifications.map((notification) => (
          <article
            key={notification.id}
            className={`flex items-start gap-3 rounded-xl border p-4 ${notification.style}`}
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 font-bold"
            >
              {notification.icon}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="mt-1 text-sm">{notification.message}</p>

              <Link
                to={`/bookings/${notification.bookingId}`}
                className="mt-2 inline-block text-sm font-semibold underline underline-offset-4 hover:opacity-80"
              >
                View booking
              </Link>
            </div>

            <button
              type="button"
              onClick={() => dismissNotification(notification.id)}
              aria-label={`Dismiss ${notification.title.toLowerCase()} notification`}
              className="shrink-0 rounded px-2 py-1 text-sm font-medium hover:bg-white/60"
            >
              Dismiss
            </button>
          </article>
        ))}
      </div>

      {notifications.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          {showAll
            ? "Show fewer updates"
            : `Show all ${notifications.length} updates`}
        </button>
      )}
    </section>
  );
}
