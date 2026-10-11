import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getOwnerBookings,
  updateBookingStatus,
} from "../services/bookingService";

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingBookingIds, setUpdatingBookingIds] = useState([]);

  // Prevent rapid duplicate requests before React has re-rendered.
  const updatingIdsRef = useRef(new Set());

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getOwnerBookings();
      setBookings(data.bookings || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load bookings. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (bookingId, nextStatus) => {
    // Stop duplicate requests for the same booking.
    if (updatingIdsRef.current.has(bookingId)) {
      return;
    }

    const booking = bookings.find((item) => item._id === bookingId);

    if (!booking) {
      setActionError(
        "This booking could not be found. Refresh the page and try again.",
      );
      return;
    }

    // Keep the available actions aligned with the backend transition rules.
    const allowedTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[booking.status]?.includes(nextStatus)) {
      setActionError(
        "This booking can no longer be updated to that status. Refresh your bookings and try again.",
      );
      return;
    }

    if (nextStatus === "cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this booking?",
      );

      if (!confirmed) {
        return;
      }
    }

    updatingIdsRef.current.add(bookingId);
    setUpdatingBookingIds((current) => [...current, bookingId]);
    setActionError("");

    try {
      const data = await updateBookingStatus(bookingId, nextStatus);

      if (!data.booking) {
        throw new Error("The server did not return the updated booking.");
      }

      setBookings((currentBookings) =>
        currentBookings.map((item) =>
          item._id === bookingId ? data.booking : item,
        ),
      );

      // Tell the shared navbar and notification components to refresh.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bookflow:notifications-updated"));
      }
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update the booking. Please try again.",
      );

      // Reload server data in case the booking changed elsewhere.
      try {
        const data = await getOwnerBookings();
        setBookings(data.bookings || []);
      } catch {
        // Keep the original action error visible if refreshing also fails.
      }
    } finally {
      updatingIdsRef.current.delete(bookingId);
      setUpdatingBookingIds((current) =>
        current.filter((id) => id !== bookingId),
      );
    }
  };

  const getStatusClasses = (status) => {
    const classes = {
      pending: "bg-yellow-50 text-yellow-700",
      confirmed: "bg-blue-50 text-blue-700",
      completed: "bg-green-50 text-green-700",
      cancelled: "bg-red-50 text-red-700",
    };

    return classes[status] || "bg-slate-100 text-slate-700";
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not specified";
    }

    // Preserve date-only strings to avoid timezone shifts.
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              View and manage appointments booked for your services.
            </p>
          </div>
        </div>

        {!isLoading && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
              found
            </p>

            <button
              type="button"
              onClick={fetchBookings}
              disabled={isLoading || updatingBookingIds.length > 0}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh bookings
            </button>
          </div>
        )}

        {isLoading && (
          <div
            role="status"
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

        {!isLoading && !error && bookings.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              No bookings yet
            </h2>

            <p className="mt-2 text-slate-600">
              When customers book your services, their appointments will appear
              here.
            </p>
          </div>
        )}

        {!isLoading && !error && bookings.length > 0 && (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const isUpdating = updatingBookingIds.includes(booking._id);
              const canManage =
                booking.status === "pending" || booking.status === "confirmed";

              return (
                <article
                  key={booking._id}
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
                            {booking.startTime || "—"} -{" "}
                            {booking.endTime || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">Price</p>

                          <p className="mt-1 font-semibold text-slate-900">
                            ${booking.service?.price ?? 0}
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
                            handleStatusUpdate(booking._id, "confirmed")
                          }
                          disabled={isUpdating}
                          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "Updating..." : "Confirm booking"}
                        </button>
                      )}

                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusUpdate(booking._id, "completed")
                          }
                          disabled={isUpdating}
                          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "Updating..." : "Mark completed"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(booking._id, "cancelled")
                        }
                        disabled={isUpdating}
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
