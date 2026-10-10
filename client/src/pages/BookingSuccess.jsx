import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

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

function BookingSuccess() {
  const location = useLocation();
  const [copyMessage, setCopyMessage] = useState("");

  const { booking, fallback } = location.state || {};

  if (!booking) {
    return <Navigate to="/bookings" replace />;
  }

  const bookingId = booking._id || booking.id;
  const bookingReference = bookingId
    ? bookingId.toString().slice(-8).toUpperCase()
    : null;

  const service = booking.service || fallback?.service || {};
  const date = booking.date || fallback?.date;
  const startTime = booking.startTime || fallback?.startTime;
  const endTime = booking.endTime || fallback?.endTime;

  const handleCopyFullId = async () => {
    setCopyMessage("");

    if (!bookingId) {
      setCopyMessage("The full booking ID is unavailable.");
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(bookingId.toString());
      setCopyMessage("Full booking ID copied!");
    } catch {
      setCopyMessage(
        `Automatic copying failed. Your full booking ID is: ${bookingId}`,
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-green-50 px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Booking successful!
            </h1>

            <p className="mt-3 text-slate-600">
              Your booking has been submitted. You can review its status and
              details below.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Booking reference
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="font-mono text-2xl font-bold text-slate-900">
                  {bookingReference ? `#${bookingReference}` : "Unavailable"}
                </p>

                {bookingId && (
                  <button
                    type="button"
                    onClick={handleCopyFullId}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Copy full ID
                  </button>
                )}
              </div>

              {copyMessage && (
                <p
                  className="mt-3 break-words text-sm text-slate-600"
                  role="status"
                >
                  {copyMessage}
                </p>
              )}

              <p className="mt-3 text-sm text-slate-500">
                Keep this reference for your records.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm text-slate-500">Service</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {service.name || "Service"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Appointment date</p>
                <p className="mt-1 font-semibold leading-relaxed text-slate-900">
                  {formatBookingDate(date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Appointment time</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatBookingTime(startTime)} – {formatBookingTime(endTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {booking.status || "Pending"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Service provider</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {service.owner?.name || "Provider information unavailable"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="mt-1 font-semibold text-slate-900">
                  ${service.price ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/bookings"
                className="inline-flex justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                View my bookings
              </Link>

              <Link
                to="/services"
                className="inline-flex justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Browse more services
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default BookingSuccess;
