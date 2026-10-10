import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyBookings } from "../services/bookingService";
import {
  formatBookingDate,
  formatBookingTime,
} from "../utils/bookingFormatters";

const BOOKING_STEPS = [
  {
    status: "pending",
    title: "Booking requested",
    description: "Your booking request has been submitted.",
  },
  {
    status: "confirmed",
    title: "Booking confirmed",
    description: "The provider has accepted your booking.",
  },
  {
    status: "completed",
    title: "Booking completed",
    description: "This booking has been completed.",
  },
];

function getBookingId(booking) {
  return booking?._id || booking?.id || "";
}

function getBookingStatus(booking) {
  return String(booking?.status || "pending").toLowerCase();
}

function getStatusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || status;
}

function getStatusStyles(status) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return styles[status] || "bg-gray-100 text-gray-700";
}

function getTimelineState(stepStatus, currentStatus) {
  if (currentStatus === "cancelled") {
    return "cancelled";
  }

  const currentIndex = BOOKING_STEPS.findIndex(
    (step) => step.status === currentStatus,
  );
  const stepIndex = BOOKING_STEPS.findIndex(
    (step) => step.status === stepStatus,
  );

  if (currentIndex === -1 || stepIndex === -1) {
    return "upcoming";
  }

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function StatusTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg text-red-700">
            ×
          </span>
          <div>
            <h3 className="font-semibold text-red-900">Booking cancelled</h3>
            <p className="mt-1 text-sm text-red-800">
              This booking will not proceed. You can return to your bookings to
              review your other reservations.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">Booking progress</h2>
      <p className="mt-1 text-sm text-gray-500">
        Follow the status of your booking below.
      </p>

      <ol className="mt-6">
        {BOOKING_STEPS.map((step, index) => {
          const state = getTimelineState(step.status, status);
          const isLast = index === BOOKING_STEPS.length - 1;

          return (
            <li
              key={step.status}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 ${
                    state === "complete" ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  state === "complete"
                    ? "border-green-600 bg-green-600 text-white"
                    : state === "current"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
                aria-label={
                  state === "complete"
                    ? "Completed step"
                    : state === "current"
                      ? "Current step"
                      : "Upcoming step"
                }
              >
                {state === "complete" ? "✓" : index + 1}
              </span>

              <div className="pt-1">
                <h3
                  className={`font-medium ${
                    state === "upcoming" ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {step.title}
                  {state === "current" && (
                    <span className="ml-2 text-xs font-normal text-blue-700">
                      Current status
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {status === "pending" && (
        <p className="mt-5 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Your booking is waiting for the provider's response.
        </p>
      )}

      {status === "confirmed" && (
        <p className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          Your booking is confirmed. Check the date and time below before your
          appointment.
        </p>
      )}

      {status === "completed" && (
        <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          This booking is marked as completed.
        </p>
      )}
    </section>
  );
}

export default function BookingDetails() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyBookings();
      const bookings = Array.isArray(result)
        ? result
        : Array.isArray(result?.bookings)
          ? result.bookings
          : Array.isArray(result?.data)
            ? result.data
            : [];

      const foundBooking = bookings.find(
        (item) => getBookingId(item) === bookingId,
      );

      if (!foundBooking) {
        setBooking(null);
        setError("We couldn't find this booking in your bookings.");
        return;
      }

      setBooking(foundBooking);
    } catch (err) {
      setBooking(null);
      setError(
        err?.response?.data?.message ||
          "Unable to load this booking. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleCopyReference() {
    const fullId = getBookingId(booking);

    if (!fullId) {
      setCopyMessage("Booking reference is unavailable.");
      return;
    }

    try {
      await navigator.clipboard.writeText(fullId);
      setCopyMessage("Full booking ID copied.");
    } catch {
      setCopyMessage(`Full booking ID: ${fullId}`);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-gray-600">Loading booking details...</p>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to show booking
          </h1>
          <p className="mt-2 text-sm text-red-800">
            {error || "This booking could not be found."}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadBooking}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Try again
            </button>
            <Link
              to="/bookings"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Back to my bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fullId = getBookingId(booking);
  const reference = fullId ? fullId.slice(-8).toUpperCase() : "Unavailable";
  const status = getBookingStatus(booking);
  const serviceName =
    booking.service?.name || booking.service?.title || "Service";
  const providerName =
    booking.service?.owner?.name ||
    booking.service?.provider?.name ||
    booking.provider?.name ||
    "Not available";
  const price = booking.service?.price ?? booking.price;
  const duration = booking.service?.duration ?? booking.duration;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <Link
          to="/bookings"
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          ← Back to my bookings
        </Link>
      </div>

      <header className="mb-6">
        <p className="text-sm text-gray-500">Booking details</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          {serviceName}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(
              status,
            )}`}
          >
            {getStatusLabel(status)}
          </span>
          <span className="text-sm text-gray-500">
            Reference: <strong className="text-gray-800">#{reference}</strong>
          </span>
          <button
            type="button"
            onClick={handleCopyReference}
            className="text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Copy full ID
          </button>
        </div>

        {copyMessage && (
          <p className="mt-2 break-all text-sm text-gray-600" role="status">
            {copyMessage}
          </p>
        )}
      </header>

      <div className="space-y-5">
        <StatusTimeline status={status} />

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Appointment information
          </h2>

          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {formatBookingDate(booking.date)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">Time</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {booking.startTime
                  ? formatBookingTime(booking.startTime)
                  : "Time unavailable"}
                {booking.endTime
                  ? ` – ${formatBookingTime(booking.endTime)}`
                  : ""}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">Service provider</dt>
              <dd className="mt-1 font-medium text-gray-900">{providerName}</dd>
            </div>

            {duration != null && (
              <div>
                <dt className="text-sm text-gray-500">Duration</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {duration} minutes
                </dd>
              </div>
            )}

            {price != null && (
              <div>
                <dt className="text-sm text-gray-500">Price</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  ${Number(price).toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/bookings"
          className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
        >
          View all bookings
        </Link>
        <Link
          to="/services"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse services
        </Link>
      </div>
    </main>
  );
}
