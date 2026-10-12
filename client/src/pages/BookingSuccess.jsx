import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  formatBookingDate,
  formatBookingTime,
} from "../utils/bookingFormatters";

function BookingSuccess() {
  const location = useLocation();
  const [copyMessage, setCopyMessage] = useState("");
  const [isCopying, setIsCopying] = useState(false);

  const { booking, fallback } = location.state || {};

  if (!booking) {
    return <Navigate to="/bookings" replace />;
  }

  const bookingId = booking._id || booking.id;
  const fullBookingId = bookingId?.toString();

  const bookingReference = fullBookingId
    ? fullBookingId.slice(-8).toUpperCase()
    : null;

  const service = booking.service || fallback?.service || {};
  const date = booking.date || fallback?.date;
  const startTime = booking.startTime || fallback?.startTime;
  const endTime = booking.endTime || fallback?.endTime;
  const status = booking.status || "pending";

  const statusStyles = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

  const handleCopyFullId = async () => {
    if (!fullBookingId || isCopying) return;

    setCopyMessage("");
    setIsCopying(true);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(fullBookingId);
      setCopyMessage("Full booking ID copied!");
    } catch {
      setCopyMessage(
        `Automatic copying failed. Copy this ID manually: ${fullBookingId}`,
      );
    } finally {
      setIsCopying(false);
    }
  };

  const displayDate = date
    ? formatBookingDate(date) || "Date unavailable"
    : "Date unavailable";

  const displayStartTime = startTime
    ? formatBookingTime(startTime)
    : "Time unavailable";

  const displayEndTime = endTime ? formatBookingTime(endTime) : "Unavailable";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-green-50 px-6 py-10 text-center sm:px-10">
            <div
              aria-hidden="true"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700"
            >
              ✓
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Booking successful!
            </h1>

            <p className="mt-3 text-slate-600">
              Your booking request has been submitted. You can check its current
              status and details below.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Booking reference
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="break-all font-mono text-2xl font-bold text-slate-900">
                  {bookingReference ? `#${bookingReference}` : "Unavailable"}
                </p>

                {fullBookingId && (
                  <button
                    type="button"
                    onClick={handleCopyFullId}
                    disabled={isCopying}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCopying ? "Copying..." : "Copy full ID"}
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
                  {service.name || "Service information unavailable"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Appointment date</p>
                <p className="mt-1 font-semibold leading-relaxed text-slate-900">
                  {displayDate}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Appointment time</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {displayStartTime}
                  {endTime ? ` – ${displayEndTime}` : ""}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    statusStyles[status.toLowerCase()] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {formattedStatus}
                </span>
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
                  {service.price != null ? `$${service.price}` : "Unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Your booking may need provider confirmation. Visit My Bookings
                to review the latest status.
              </p>
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
