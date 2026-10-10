import { Link, Navigate, useLocation } from "react-router-dom";

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const dateString = String(dateValue).slice(0, 10);
  const parts = dateString.split("-");

  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BookingSuccess() {
  const location = useLocation();
  const { booking, fallback } = location.state || {};

  // A successful booking should provide confirmation details.
  // If someone opens this URL directly, send them to their bookings.
  if (!booking) {
    return <Navigate to="/bookings" replace />;
  }

  const service =
    booking.service && typeof booking.service === "object"
      ? booking.service
      : fallback?.service;

  const date = booking.date || fallback?.date;
  const startTime = booking.startTime || fallback?.startTime;
  const endTime = booking.endTime || fallback?.endTime;
  const price = service?.price ?? fallback?.service?.price;
  const duration = service?.duration ?? fallback?.service?.duration;
  const provider = service?.owner?.name || fallback?.service?.owner?.name;
  const status = booking.status || "pending";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700"
            aria-hidden="true"
          >
            ✓
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-700">
            Booking submitted
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Your appointment is booked!
          </h1>

          <p className="mx-auto mt-3 max-w-lg leading-6 text-slate-600">
            Your booking was created successfully. Keep these details for your
            appointment, and check your bookings for any status updates.
          </p>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm text-slate-500">Service</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {service?.name || "Your selected service"}
                </h2>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                {status}
              </span>
            </div>

            <dl className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-600">Date</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">
                  {formatDate(date)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-600">Time</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">
                  {startTime
                    ? `${startTime}${endTime ? ` – ${endTime}` : ""}`
                    : "Not available"}
                </dd>
              </div>

              {duration != null && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-slate-600">Duration</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {duration} minutes
                  </dd>
                </div>
              )}

              {provider && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-slate-600">Provider</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {provider}
                  </dd>
                </div>
              )}

              {price != null && (
                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                  <dt className="font-semibold text-slate-900">Total price</dt>
                  <dd className="text-xl font-bold text-slate-900">${price}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to="/bookings"
              className="rounded-lg bg-slate-900 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
            >
              View my bookings
            </Link>

            <Link
              to="/services"
              className="rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Browse services
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default BookingSuccess;
