import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyBookings } from "../services/bookingService";

function formatBookingDate(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString || "Date unavailable";
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatBookingTime(timeString) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeString || "");

  if (!match) {
    return timeString || "Time unavailable";
  }

  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getBookingReference(booking) {
  const bookingId = booking?._id || booking?.id;

  return bookingId ? bookingId.toString().slice(-8).toUpperCase() : null;
}

function getStatusClasses(status) {
  const statusClasses = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    confirmed: "bg-green-50 text-green-700 ring-green-200",
    completed: "bg-blue-50 text-blue-700 ring-blue-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
  };

  return statusClasses[status] || "bg-slate-50 text-slate-700 ring-slate-200";
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function BookingDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getMyBookings();
      const bookings = data.bookings || [];

      const foundBooking = bookings.find(
        (item) => String(item._id || item.id) === String(bookingId),
      );

      if (!foundBooking) {
        setBooking(null);
        setError("We couldn't find this booking in your bookings.");
        return;
      }

      setBooking(foundBooking);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load this booking. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const bookingReference = getBookingReference(booking);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/bookings"
          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back to my bookings
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Booking details
          </h1>
          <p className="mt-3 text-slate-600">
            Review your appointment information.
          </p>
        </div>

        {isLoading && (
          <div
            role="status"
            className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading booking details...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Unable to show booking
            </h2>
            <p className="mt-3 text-slate-600">{error}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={loadBooking}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Try again
              </button>

              <Link
                to="/bookings"
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                My bookings
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && booking && (
          <article className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Service
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {booking.service?.name || "Service"}
                  </h2>
                  <p className="mt-3 font-mono text-sm text-slate-600">
                    Reference:{" "}
                    {bookingReference ? `#${bookingReference}` : "Unavailable"}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${getStatusClasses(
                    booking.status,
                  )}`}
                >
                  {formatStatus(booking.status)}
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <p className="text-sm text-slate-500">Appointment date</p>
                <p className="mt-2 font-semibold leading-relaxed text-slate-900">
                  {formatBookingDate(booking.date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Appointment time</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {formatBookingTime(booking.startTime)} –{" "}
                  {formatBookingTime(booking.endTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Service price</p>
                <p className="mt-2 font-semibold text-slate-900">
                  ${booking.service?.price ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Duration</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {booking.service?.duration != null
                    ? `${booking.service.duration} minutes`
                    : "Not specified"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">Service provider</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {booking.service?.owner?.name ||
                    "Provider information unavailable"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
              <Link
                to="/bookings"
                className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Back to my bookings
              </Link>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

export default BookingDetails;
