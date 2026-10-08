import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/bookingService";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
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
    };

    fetchBookings();
  }, []);

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

  const canCancelBooking = (booking) => {
    return booking.status === "pending" || booking.status === "confirmed";
  };

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
          booking._id === bookingId
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

          <h1 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">
            My bookings
          </h1>

          <p className="mt-3 text-slate-600">
            View and manage your appointments.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
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

        {!isLoading && !error && bookings.length > 0 && (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const isCancelling = cancellingBookingId === booking._id;

              const canCancel = canCancelBooking(booking);

              return (
                <article
                  key={booking._id}
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

                  {canCancel && (
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={isCancelling}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel booking"}
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

export default MyBookings;
