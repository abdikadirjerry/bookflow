import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getOwnerBookings,
  updateBookingStatus,
} from "../services/bookingService";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function getBookingId(booking) {
  const id = booking?._id ?? booking?.id;
  return id == null ? "" : String(id);
}

function getBookingsFromResponse(data) {
  const bookings = Array.isArray(data)
    ? data
    : Array.isArray(data?.bookings)
      ? data.bookings
      : Array.isArray(data?.data?.bookings)
        ? data.data.bookings
        : Array.isArray(data?.data)
          ? data.data
          : null;

  if (
    !bookings ||
    !bookings.every((booking) => booking && typeof booking === "object")
  ) {
    throw new Error("The server returned an invalid bookings response.");
  }

  return bookings;
}

function getDateTimestamp(booking) {
  if (!booking?.date) return 0;

  const dateValue = String(booking.date);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  const date = dateMatch
    ? new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
      )
    : new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 0;

  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(String(booking.startTime || ""));

  if (timeMatch && Number(timeMatch[1]) <= 23 && Number(timeMatch[2]) <= 59) {
    date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  }

  return date.getTime();
}

function formatDate(value) {
  if (!value) return "Not specified";

  const dateValue = String(value);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  const date = dateMatch
    ? new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
      )
    : new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const match = /^(\d{1,2}):(\d{2})/.exec(String(value));

  if (!match) return String(value);

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return String(value);

  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(value) {
  if (value == null || value === "") return "Not available";

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) return "Not available";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getStatusClasses(status) {
  const classes = {
    pending: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-blue-50 text-blue-700",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return classes[status] || "bg-slate-100 text-slate-700";
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [updatingBookingIds, setUpdatingBookingIds] = useState([]);

  const mountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const updatingIdsRef = useRef(new Set());

  const fetchBookings = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;

    setIsLoading(true);
    setError("");

    try {
      const data = await getOwnerBookings();
      const nextBookings = getBookingsFromResponse(data);

      if (!mountedRef.current || requestId !== fetchRequestIdRef.current) {
        return;
      }

      setBookings(nextBookings);
    } catch (err) {
      if (!mountedRef.current || requestId !== fetchRequestIdRef.current) {
        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load bookings. Please try again.",
      );
    } finally {
      if (mountedRef.current && requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchBookings();

    return () => {
      mountedRef.current = false;
      fetchRequestIdRef.current += 1;
    };
  }, [fetchBookings]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((booking) => {
      if (Object.prototype.hasOwnProperty.call(counts, booking.status)) {
        counts[booking.status] += 1;
      }
    });

    return counts;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const searchableText = [
        booking.service?.name,
        booking.customer?.name,
        booking.customer?.email,
        booking.date,
        booking.startTime,
        booking.endTime,
        getBookingId(booking),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });

    result.sort((a, b) => {
      const difference = getDateTimestamp(a) - getDateTimestamp(b);
      return sortOrder === "newest" ? -difference : difference;
    });

    return result;
  }, [bookings, search, statusFilter, sortOrder]);

  const handleStatusUpdate = async (bookingId, nextStatus) => {
    const id = String(bookingId || "");

    if (!id || updatingIdsRef.current.has(id)) return;

    const booking = bookings.find((item) => getBookingId(item) === id);

    if (!booking) {
      setActionError("Booking not found. Refresh and try again.");
      return;
    }

    if (!ALLOWED_TRANSITIONS[booking.status]?.includes(nextStatus)) {
      setActionError(
        "This booking can no longer be updated to that status. Refresh and try again.",
      );
      return;
    }

    if (nextStatus === "cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this booking?",
      );

      if (!confirmed) return;
    }

    updatingIdsRef.current.add(id);
    setUpdatingBookingIds((current) => [...current, id]);
    setActionError("");

    try {
      const data = await updateBookingStatus(id, nextStatus);
      const updatedBooking = data?.booking ?? data?.data?.booking;

      if (!updatedBooking || typeof updatedBooking !== "object") {
        throw new Error("The server did not return the updated booking.");
      }

      const updatedId = getBookingId(updatedBooking);

      if (updatedId && updatedId !== id) {
        throw new Error("The server returned an unexpected booking.");
      }

      if (!mountedRef.current) return;

      setBookings((current) =>
        current.map((item) =>
          getBookingId(item) === id
            ? { ...item, ...updatedBooking, _id: id }
            : item,
        ),
      );

      window.dispatchEvent(new Event("bookflow:notifications-updated"));
    } catch (err) {
      if (!mountedRef.current) return;

      setActionError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update the booking. Please try again.",
      );

      // Refresh server state after a failed update. Keep the original error
      // visible if this recovery request also fails.
      const recoveryRequestId = ++fetchRequestIdRef.current;

      try {
        const data = await getOwnerBookings();
        const latestBookings = getBookingsFromResponse(data);

        if (
          mountedRef.current &&
          recoveryRequestId === fetchRequestIdRef.current
        ) {
          setBookings(latestBookings);
        }
      } catch {
        // Keep the original status-update error.
      }
    } finally {
      updatingIdsRef.current.delete(id);

      if (mountedRef.current) {
        setUpdatingBookingIds((current) =>
          current.filter((itemId) => itemId !== id),
        );
      }
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Business management
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Bookings
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Search, filter, and manage appointments booked for your services.
            </p>
          </div>
        </div>

        {!isLoading && !error && (
          <>
            <section
              aria-label="Booking counts"
              className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            >
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                  className={`rounded-xl border bg-white p-4 text-left transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                    statusFilter === option.value
                      ? "border-slate-900 ring-1 ring-slate-900"
                      : "border-slate-200"
                  }`}
                >
                  <p className="text-sm text-slate-500">{option.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {statusCounts[option.value]}
                  </p>
                </button>
              ))}
            </section>

            <section
              aria-label="Search and filter bookings"
              className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="booking-search"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Search bookings
                  </label>
                  <input
                    id="booking-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Customer, email, service..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="booking-status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Filter by status
                  </label>
                  <select
                    id="booking-status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({statusCounts[option.value]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="booking-sort"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Sort by appointment date
                  </label>
                  <select
                    id="booking-sort"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="newest">Latest first</option>
                    <option value="oldest">Earliest first</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600" aria-live="polite">
                  Showing {filteredBookings.length} of {bookings.length}{" "}
                  {bookings.length === 1 ? "booking" : "bookings"}
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={
                      !search &&
                      statusFilter === "all" &&
                      sortOrder === "newest"
                    }
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear filters
                  </button>

                  <button
                    type="button"
                    onClick={fetchBookings}
                    disabled={updatingBookingIds.length > 0 || isLoading}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Refreshing..." : "Refresh bookings"}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading bookings...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Unable to load bookings
            </h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchBookings}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && actionError && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-red-700">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="self-start text-sm font-semibold text-red-800 underline hover:text-red-950 sm:self-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        {!isLoading && !error && filteredBookings.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              {bookings.length === 0
                ? "No bookings yet"
                : "No matching bookings"}
            </h2>
            <p className="mt-2 text-slate-600">
              {bookings.length === 0
                ? "When customers book your services, their appointments will appear here."
                : "Try changing your search or filters."}
            </p>
            {bookings.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && filteredBookings.length > 0 && (
          <div className="space-y-5">
            {filteredBookings.map((booking) => {
              const bookingId = getBookingId(booking);
              const isUpdating = updatingBookingIds.includes(bookingId);
              const canManage = ALLOWED_TRANSITIONS[booking.status]?.length > 0;

              return (
                <article
                  key={bookingId || `${booking.service?.name}-${booking.date}`}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">
                          {booking.service?.name || "Unknown service"}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            booking.status,
                          )}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-sm text-slate-500">Customer</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {booking.customer?.name || "Unknown customer"}
                          </p>
                          {booking.customer?.email && (
                            <p className="mt-1 break-all text-sm text-slate-600">
                              {booking.customer.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">Date</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatDate(booking.date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">Time</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatTime(booking.startTime)} –{" "}
                            {formatTime(booking.endTime)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">Price</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatPrice(
                              booking.service?.price ?? booking.price,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                      {booking.status === "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusUpdate(bookingId, "confirmed")
                          }
                          disabled={isUpdating || !bookingId}
                          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "Updating..." : "Confirm booking"}
                        </button>
                      )}

                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusUpdate(bookingId, "completed")
                          }
                          disabled={isUpdating || !bookingId}
                          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "Updating..." : "Mark completed"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(bookingId, "cancelled")
                        }
                        disabled={isUpdating || !bookingId}
                        className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "Updating..." : "Cancel booking"}
                      </button>
                    </div>
                  )}

                  {!canManage && (
                    <div className="mt-6 border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-500">
                        {booking.status === "completed"
                          ? "This booking has been completed. No further status changes are available."
                          : booking.status === "cancelled"
                            ? "This booking has been cancelled. No further status changes are available."
                            : "No actions are available for this booking."}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default OwnerBookings;
