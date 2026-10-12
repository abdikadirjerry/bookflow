import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/bookingService";
import {
  formatBookingDate,
  formatBookingTime,
} from "../utils/bookingFormatters";
import BookingNotifications from "../components/BookingNotifications";

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

function getBookingId(booking) {
  const id = booking?._id || booking?.id;
  return id == null ? "" : String(id);
}

function getBookingReference(booking) {
  const id = getBookingId(booking);
  return id ? id.slice(-8).toUpperCase() : null;
}

function getAppointmentTimestamp(booking) {
  if (!booking?.date || !booking?.startTime) {
    return Number.POSITIVE_INFINITY;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(booking.date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(booking.startTime);

  if (!dateMatch || !timeMatch) {
    return Number.POSITIVE_INFINITY;
  }

  const [, year, month, day] = dateMatch.map(Number);
  const [, hours, minutes] = timeMatch.map(Number);

  const timestamp = new Date(year, month - 1, day, hours, minutes).getTime();

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getCreationTimestamp(booking) {
  if (!booking?.createdAt) return 0;

  const timestamp = new Date(booking.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getStatusClasses(status) {
  const classes = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    confirmed: "bg-green-50 text-green-700 ring-green-200",
    completed: "bg-blue-50 text-blue-700 ring-blue-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    classes[status?.toLowerCase()] ||
    "bg-slate-50 text-slate-700 ring-slate-200"
  );
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copyingBookingId, setCopyingBookingId] = useState(null);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const cancelInProgressRef = useRef(false);
  const copyInProgressRef = useRef(false);

  const loadBookings = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError("");

    try {
      const data = await getMyBookings();

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      if (!Array.isArray(data?.bookings)) {
        throw new Error("The server returned an unexpected bookings response.");
      }

      setBookings(data.bookings);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load your bookings. Please try again.",
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadBookings();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadBookings]);

  const bookingCounts = useMemo(() => {
    const counts = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((booking) => {
      const status = booking.status?.toLowerCase();

      if (Object.prototype.hasOwnProperty.call(counts, status)) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [bookings]);

  const dateRangeError =
    fromDate && toDate && toDate < fromDate
      ? "The end date cannot be earlier than the start date."
      : "";

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().replace(/^#/, "").toLowerCase();

    return bookings
      .filter((booking) => {
        const status = booking.status?.toLowerCase() || "";

        const matchesStatus =
          selectedStatus === "all" || status === selectedStatus;

        const serviceName = (booking.service?.name || "").toLowerCase();

        const reference = (getBookingReference(booking) || "").toLowerCase();

        const matchesSearch =
          !query || serviceName.includes(query) || reference.includes(query);

        const matchesDateRange =
          !dateRangeError &&
          (!fromDate || (booking.date && booking.date >= fromDate)) &&
          (!toDate || (booking.date && booking.date <= toDate));

        return matchesStatus && matchesSearch && matchesDateRange;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return getCreationTimestamp(b) - getCreationTimestamp(a);
        }

        if (sortBy === "oldest") {
          return getCreationTimestamp(a) - getCreationTimestamp(b);
        }

        return getAppointmentTimestamp(a) - getAppointmentTimestamp(b);
      });
  }, [
    bookings,
    selectedStatus,
    sortBy,
    searchQuery,
    fromDate,
    toDate,
    dateRangeError,
  ]);

  const handleRefresh = async () => {
    setCancelError("");
    setCopyMessage("");
    await loadBookings();
  };

  const handleCopyReference = async (booking) => {
    if (copyInProgressRef.current) return;

    const bookingId = getBookingId(booking);
    const reference = getBookingReference(booking);

    setCopyMessage("");

    if (!bookingId || !reference) {
      setCopyMessage("This booking reference is unavailable.");
      return;
    }

    copyInProgressRef.current = true;
    setCopyingBookingId(bookingId);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(reference);

      if (mountedRef.current) {
        setCopyMessage(`Reference #${reference} copied.`);
      }
    } catch {
      if (mountedRef.current) {
        setCopyMessage(
          `Automatic copying failed. Copy this reference manually: ${reference}`,
        );
      }
    } finally {
      copyInProgressRef.current = false;

      if (mountedRef.current) {
        setCopyingBookingId(null);
      }
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (cancelInProgressRef.current) return;

    const booking = bookings.find((item) => getBookingId(item) === bookingId);

    const status = booking?.status?.toLowerCase();

    if (!booking || !["pending", "confirmed"].includes(status)) {
      setCancelError(
        "This booking can no longer be cancelled. Refresh your bookings.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone.",
    );

    if (!confirmed) return;

    cancelInProgressRef.current = true;
    setCancellingBookingId(bookingId);
    setCancelError("");

    try {
      const data = await cancelBooking(bookingId);

      if (!mountedRef.current) return;

      const updatedStatus = data?.booking?.status;

      if (
        updatedStatus &&
        !["pending", "confirmed", "completed", "cancelled"].includes(
          updatedStatus.toLowerCase(),
        )
      ) {
        throw new Error("The server returned an unexpected booking status.");
      }

      if (updatedStatus && updatedStatus.toLowerCase() !== "cancelled") {
        throw new Error(
          "The server did not confirm that the booking was cancelled.",
        );
      }

      setBookings((current) =>
        current.map((item) =>
          getBookingId(item) === bookingId
            ? { ...item, status: updatedStatus || "cancelled" }
            : item,
        ),
      );

      window.dispatchEvent(new Event("bookflow:notifications-updated"));
    } catch (error) {
      if (mountedRef.current) {
        setCancelError(
          error.response?.data?.message ||
            error.message ||
            "Unable to cancel this booking. Please try again.",
        );

        await loadBookings();
      }
    } finally {
      cancelInProgressRef.current = false;

      if (mountedRef.current) {
        setCancellingBookingId(null);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setFromDate("");
    setToDate("");
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

        {!isLoading && !error && <BookingNotifications />}

        {!isLoading && !error && bookings.length > 0 && (
          <section className="mb-6 space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
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
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by service name or reference..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Filter by status
              </h2>
              <div className="flex flex-wrap gap-2">
                {BOOKING_STATUSES.map((status) => {
                  const selected = selectedStatus === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      aria-pressed={selected}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {status === "all" ? "All" : formatStatus(status)} (
                      {bookingCounts[status]})
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Filter by appointment date
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="booking-from-date"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    From date
                  </label>
                  <input
                    id="booking-from-date"
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="booking-to-date"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    To date
                  </label>
                  <input
                    id="booking-to-date"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(event) => setToDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {dateRangeError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {dateRangeError}
                </p>
              )}
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

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500" aria-live="polite">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-fit rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>
        )}

        {copyMessage && (
          <p
            role="status"
            className="mb-5 break-words rounded-xl bg-slate-100 p-3 text-sm text-slate-700"
          >
            {copyMessage}
          </p>
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
                {dateRangeError
                  ? "Check your date range"
                  : "No matching bookings"}
              </h2>
              <p className="mt-2 text-slate-600">
                {dateRangeError ||
                  "No bookings match your current filters. Try changing your search, status, or date range."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
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
              const isCancelling = cancellingBookingId === bookingId;
              const status = booking.status?.toLowerCase();
              const canCancel = ["pending", "confirmed"].includes(status);
              const reference = getBookingReference(booking);
              const isCopying = copyingBookingId === bookingId;

              return (
                <article
                  key={bookingId || reference}
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
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-bold text-slate-800">
                            {reference ? `#${reference}` : "Unavailable"}
                          </p>

                          {reference && (
                            <button
                              type="button"
                              onClick={() => handleCopyReference(booking)}
                              disabled={isCopying}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                              aria-label={`Copy reference ${reference}`}
                            >
                              {isCopying ? "Copying..." : "⧉ Copy"}
                            </button>
                          )}
                        </div>
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
                      <p className="mt-1 font-semibold leading-relaxed text-slate-900">
                        {formatBookingDate(booking.date) || "Unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Time</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatBookingTime(booking.startTime)} –{" "}
                        {formatBookingTime(booking.endTime)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Price</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {booking.service?.price != null
                          ? `$${booking.service.price}`
                          : "—"}
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
                    {bookingId && (
                      <Link
                        to={`/bookings/${bookingId}`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        View details
                      </Link>
                    )}

                    {canCancel && bookingId && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(bookingId)}
                        disabled={Boolean(cancellingBookingId)}
                        aria-busy={isCancelling}
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
