import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyBookings } from "../services/bookingService";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (!match) {
    return dateValue;
  }

  const [, year, month, day] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
        (item) => String(item._id || item.id) === bookingId,
      );

      if (!foundBooking) {
        setBooking(null);
        setError(
          "We couldn't find this booking in your account. It may not exist or may no longer be accessible.",
        );
        return;
      }

      setBooking(foundBooking);
    } catch (error) {
      setBooking(null);
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

  const getStatusClasses = (status) => {
    const classes = {
      pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
      confirmed: "bg-green-50 text-green-700 ring-green-200",
      completed: "bg-blue-50 text-blue-700 ring-blue-200",
      cancelled: "bg-red-50 text-red-700 ring-red-200",
    };

    return classes[status] || "bg-slate-50 text-slate-700 ring-slate-200";
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getBookingReference = (item) => {
    const id = item?._id || item?.id;

    return id ? id.toString().slice(-8).toUpperCase() : "Unavailable";
  };

  const service = booking?.service;
  const provider = service?.owner;
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

        <header className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Booking details
          </h1>

          <p className="mt-3 text-slate-600">
            View the details and current status of your appointment.
          </p>
        </header>

        {isLoading && (
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading booking details...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Unable to open booking
            </h2>

            <p className="mt-3 text-slate-600">{error}</p>

            <button
              type="button"
              onClick={loadBooking}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Try again
            </button>

            <div>
              <Link
                to="/bookings"
                className="mt-4 inline-block text-sm font-semibold text-slate-700 underline hover:text-slate-900"
              >
                Return to my bookings
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && booking && (
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Booking reference
                  </p>

                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                    {bookingReference === "Unavailable"
                      ? bookingReference
                      : `#${bookingReference}`}
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

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                {service?.name || "Service details unavailable"}
              </h2>

              <p className="mt-2 text-slate-600">
                Keep your booking reference handy if you need to discuss this
                appointment with the provider.
              </p>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <p className="text-sm text-slate-500">Appointment date</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(booking.date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Appointment time</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {booking.startTime || "—"} - {booking.endTime || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Service price</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {service?.price != null
                    ? `$${service.price}`
                    : "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Service duration</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {service?.duration != null
                    ? `${service.duration} minutes`
                    : "Not available"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">Service provider</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {provider?.name || "Not available"}
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
