import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/bookingService";

const BOOKING_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const SORT_OPTIONS = [
  { value: "upcoming", label: "Upcoming first" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("upcoming");
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getMyBookings();
      setBookings(data.bookings || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load your bookings. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const getStatusClasses = (status) => {
    const statusClasses = {
      pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
      confirmed: "bg-green-50 text-green-700 ring-green-200",
      completed: "bg-blue-50 text-blue-700 ring-blue-200",
      cancelled: "bg-red-50 text-red-700 ring-red-200",
    };

    return statusClasses[status] || "bg-slate-50 text-slate-700 ring-slate-200";
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getBookingReference = (booking) => {
    const bookingId = booking._id || booking.id;

    if (!bookingId) {
      return "Unavailable";
    }

    return bookingId.toString().slice(-8).toUpperCase();
  };

  const canCancelBooking = (booking) => {
    return booking.status === "pending" || booking.status === "confirmed";
  };

  const getAppointmentTimestamp = (booking) => {
    if (!booking.date || !booking.startTime) {
      return Number.POSITIVE_INFINITY;
    }

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(booking.date);
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(booking.startTime);

    if (!dateMatch || !timeMatch) {
      return Number.POSITIVE_INFINITY;
    }

    const [, year, month, day] = dateMatch;
    const [, hours, minutes] = timeMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
    ).getTime();
  };

  const getCreationTimestamp = (booking) => {
    if (!booking.createdAt) {
      return 0;
    }

    const timestamp = new Date(booking.createdAt).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const bookingCounts = useMemo(() => {
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
    const filtered =
      selectedStatus === "all"
        ? bookings
        : bookings.filter((booking) => booking.status === selectedStatus);

    const sorted = [...filtered];

    sorted.sort((a, b) => {
      if (sortBy === "newest") {
        return getCreationTimestamp(b) - getCreationTimestamp(a);
      }

      if (sortBy === "oldest") {
        return getCreationTimestamp(a) - getCreationTimestamp(b);
      }

      return getAppointmentTimestamp(a) - getAppointmentTimestamp(b);
    });

    return sorted;
  }, [bookings, selectedStatus, sortBy]);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingBookingId(bookingId);
      setCancelError("");

      const data = await cancelBooking(bookingId);

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          (booking._id || booking.id) === bookingId
            ? {
                ...booking,
                status: data.booking?.status || "cancelled",
              }
            : booking,
        ),
      );
    } catch (error) {
      setCancelError(
        error.response?.data?.message ||
          "Unable to cancel this booking. Please try again.",
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleRefresh = async () => {
    setCancelError("");
    await loadBookings();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            to="/services"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Browse services
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                My bookings
              </h1>

              <p className="mt-3 text-slate-600">
                View and manage your appointments.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Refreshing..." : "Refresh bookings"}
            </button>
          </div>
        </div>

        {!isLoading && !error && (
          <div className="mb-6 space-y-5">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Filter by status
              </h2>

              <div className="flex flex-wrap gap-2">
                {BOOKING_STATUSES.map((status) => {
                  const isSelected = selectedStatus === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      aria-pressed={isSelected}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {status === "all" ? "All" : formatStatus(status)}
                      {" ("}
                      {bookingCounts[status]}
                      {")"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-xs">
              <label
                htmlFor="booking-sort"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Sort bookings
              </label>

              <select
                id="booking-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isLoading && (
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading your bookings...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Unable to load bookings
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadBookings}
              className="mt-5 rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && cancelError && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
          >
            <p className="text-sm text-red-700">{cancelError}</p>
          </div>
        )}

        {!isLoading && !error && bookings.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              No bookings yet
            </h2>

            <p className="mt-2 text-slate-600">
              You haven't booked any services yet.
            </p>

            <Link
              to="/services"
              className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Browse services
            </Link>
          </div>
        )}

        {!isLoading &&
          !error &&
          bookings.length > 0 &&
          filteredBookings.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                No {selectedStatus} bookings
              </h2>

              <p className="mt-2 text-slate-600">
                You don't have any bookings with this status.
              </p>

              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Show all bookings
              </button>
            </div>
          )}

        {!isLoading && !error && filteredBookings.length > 0 && (
          <div className="space-y-5">
            {filteredBookings.map((booking) => {
              const bookingId = booking._id || booking.id;
              const isCancelling = cancellingBookingId === bookingId;
              const canCancel = canCancelBooking(booking);
              const bookingReference = getBookingReference(booking);

              return (
                <article
                  key={bookingId}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Appointment
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {booking.service?.name || "Service"}
                      </h2>

                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Booking reference
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-slate-800">
                          {bookingReference === "Unavailable"
                            ? bookingReference
                            : `#${bookingReference}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${getStatusClasses(
                        booking.status,
                      )}`}
                    >
                      {formatStatus(booking.status)}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-500">Date</p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {booking.date}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Time</p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Price</p>

                      <p className="mt-1 font-semibold text-slate-900">
                        ${booking.service?.price ?? "—"}
                      </p>
                    </div>
                  </div>

                  {booking.service?.owner && (
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <p className="text-sm text-slate-500">Provided by</p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {booking.service.owner.name}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
                    <Link
                      to={`/bookings/${bookingId}`}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      View details
                    </Link>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(bookingId)}
                        disabled={isCancelling}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel booking"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyBookings;
