import { useEffect, useState } from "react";
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
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
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
    };

    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, status) => {
    if (status === "cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this booking?",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setUpdatingBookingId(bookingId);
      setActionError("");

      const data = await updateBookingStatus(bookingId, status);

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking._id === bookingId ? data.booking : booking,
        ),
      );
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          "Unable to update the booking. Please try again.",
      );
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const getStatusClasses = (status) => {
    if (status === "confirmed") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "completed") {
      return "bg-green-50 text-green-700";
    }

    if (status === "cancelled") {
      return "bg-red-50 text-red-700";
    }

    return "bg-yellow-50 text-yellow-700";
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading bookings...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-6 ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Unable to load bookings
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && actionError && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
          >
            <p className="text-sm text-red-700">{actionError}</p>
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
              const isUpdating = updatingBookingId === booking._id;

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
                            ${booking.service?.price ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(booking.status === "pending" ||
                    booking.status === "confirmed") && (
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
