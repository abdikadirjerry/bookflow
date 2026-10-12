import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServiceById } from "../services/serviceService";
import { createBooking, getAvailableSlots } from "../services/bookingService";

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatBookingDate(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const slotsRequestId = useRef(0);
  const bookingInProgress = useRef(false);

  const [service, setService] = useState(null);
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);

  const [isLoadingService, setIsLoadingService] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [serviceError, setServiceError] = useState("");
  const [slotsError, setSlotsError] = useState("");
  const [bookingError, setBookingError] = useState("");

  const today = getLocalDateString();

  useEffect(() => {
    let isActive = true;

    async function fetchService() {
      setIsLoadingService(true);
      setServiceError("");
      setService(null);

      try {
        const data = await getServiceById(serviceId);

        if (isActive) {
          if (!data?.service) {
            setServiceError("This service could not be found.");
          } else {
            setService(data.service);
          }
        }
      } catch (error) {
        if (isActive) {
          setServiceError(
            error.response?.data?.message ||
              "Unable to load this service. Please try again.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingService(false);
        }
      }
    }

    fetchService();

    return () => {
      isActive = false;
    };
  }, [serviceId]);

  const loadAvailableSlots = useCallback(
    async ({ preserveBookingError = false } = {}) => {
      const requestId = ++slotsRequestId.current;
      const requestedDate = date;

      if (!requestedDate) {
        setAvailableSlots([]);
        setSelectedTime("");
        setSlotsError("");
        setIsLoadingSlots(false);

        if (!preserveBookingError) {
          setBookingError("");
        }

        return false;
      }

      setIsLoadingSlots(true);
      setSlotsError("");

      if (!preserveBookingError) {
        setBookingError("");
      }

      try {
        const data = await getAvailableSlots(serviceId, requestedDate);

        if (requestId !== slotsRequestId.current) {
          return false;
        }

        const slots = Array.isArray(data?.slots) ? data.slots : [];
        setAvailableSlots(slots);

        // Clear the selection if the selected slot is no longer available.
        setSelectedTime((currentTime) => {
          const stillAvailable = slots.some(
            (slot) =>
              slot.startTime === currentTime && slot.available !== false,
          );

          return stillAvailable ? currentTime : "";
        });

        return true;
      } catch (error) {
        if (requestId !== slotsRequestId.current) {
          return false;
        }

        setAvailableSlots([]);
        setSelectedTime("");
        setSlotsError(
          error.response?.data?.message ||
            "Unable to load available times. Please try again.",
        );

        return false;
      } finally {
        if (requestId === slotsRequestId.current) {
          setIsLoadingSlots(false);
        }
      }
    },
    [date, serviceId],
  );

  useEffect(() => {
    loadAvailableSlots();

    return () => {
      // Ignore responses from requests belonging to an older date or page.
      slotsRequestId.current += 1;
    };
  }, [loadAvailableSlots]);

  const handleDateChange = (event) => {
    const nextDate = event.target.value;

    setDate(nextDate);
    setSelectedTime("");
    setAvailableSlots([]);
    setSlotsError("");
    setBookingError("");
  };

  const handleTimeSelect = (time) => {
    if (isBooking || isLoadingSlots) return;

    const slotExists = availableSlots.some(
      (slot) => slot.startTime === time && slot.available !== false,
    );

    if (!slotExists) return;

    setSelectedTime(time);
    setBookingError("");
  };

  const handleBooking = async () => {
    if (bookingInProgress.current) return;

    if (!date) {
      setBookingError("Please select a date.");
      return;
    }

    if (date < getLocalDateString()) {
      setBookingError("Please select today or a future date.");
      return;
    }

    if (isLoadingSlots || slotsError) {
      setBookingError("Please load the available times before booking.");
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) => slot.startTime === selectedTime && slot.available !== false,
    );

    if (!selectedSlot) {
      setBookingError("Please select an available time.");
      return;
    }

    bookingInProgress.current = true;
    setIsBooking(true);
    setBookingError("");

    try {
      const result = await createBooking({
        serviceId,
        date,
        startTime: selectedSlot.startTime,
      });

      const booking = result?.booking;

      if (!booking) {
        setBookingError(
          "We couldn't verify the booking response. Check My Bookings before trying again.",
        );
        return;
      }

      navigate("/booking-success", {
        replace: true,
        state: {
          booking,
          fallback: {
            service,
            date,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
          },
        },
      });
    } catch (error) {
      if (error.response?.status === 409) {
        setSelectedTime("");
        setBookingError(
          "This time slot is no longer available. Choose another available time.",
        );

        await loadAvailableSlots({ preserveBookingError: true });
      } else {
        setBookingError(
          error.response?.data?.message ||
            "Unable to create your booking. Please try again.",
        );
      }
    } finally {
      bookingInProgress.current = false;
      setIsBooking(false);
    }
  };

  const selectedSlot = availableSlots.find(
    (slot) => slot.startTime === selectedTime && slot.available !== false,
  );

  const formattedDate = formatBookingDate(date);

  if (isLoadingService) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading service...</p>
          </div>
        </div>
      </main>
    );
  }

  if (serviceError || !service) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/services"
            className="mb-6 inline-block text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to services
          </Link>

          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-8 text-center ring-1 ring-red-100"
          >
            <h1 className="text-xl font-bold text-red-800">
              Service unavailable
            </h1>

            <p className="mt-2 text-red-700">{serviceError}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-800 px-4 py-2 font-semibold text-white hover:bg-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const visibleSlots = availableSlots.filter(
    (slot) => slot.available !== false,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to={`/services/${service._id}`}
          className="mb-6 inline-block text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back to service
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Booking
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {service.name}
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {service.description}
            </p>

            <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  ${service.price}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Duration</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {service.duration} minutes
                </p>
              </div>

              {service.owner && (
                <div>
                  <p className="text-sm text-slate-500">Provided by</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {service.owner.name}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:col-span-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Choose your appointment
              </h2>

              <p className="mt-2 text-slate-600">
                Select a date and choose one of the available times.
              </p>
            </div>

            <div className="mt-8">
              <label
                htmlFor="booking-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select date
              </label>

              <input
                id="booking-date"
                type="date"
                value={date}
                onChange={handleDateChange}
                min={today}
                disabled={isBooking}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {date && (
              <div className="mt-8">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Available times
                  </h3>

                  {!isLoadingSlots && !slotsError && (
                    <span className="text-sm text-slate-500">
                      {visibleSlots.length} available
                    </span>
                  )}
                </div>

                {isLoadingSlots && (
                  <div
                    role="status"
                    className="mt-4 rounded-xl bg-slate-50 p-6 text-center"
                  >
                    <p className="text-slate-600">Loading available times...</p>
                  </div>
                )}

                {!isLoadingSlots && slotsError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
                  >
                    <p className="text-sm text-red-700">{slotsError}</p>

                    <button
                      type="button"
                      onClick={() => loadAvailableSlots()}
                      disabled={isBooking}
                      className="mt-3 text-sm font-semibold text-red-800 underline hover:text-red-950 disabled:opacity-50"
                    >
                      Try loading times again
                    </button>
                  </div>
                )}

                {!isLoadingSlots &&
                  !slotsError &&
                  visibleSlots.length === 0 && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center">
                      <h3 className="font-semibold text-slate-900">
                        No available times
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        There are no available appointments on this date. Please
                        choose another date.
                      </p>
                    </div>
                  )}

                {!isLoadingSlots && !slotsError && visibleSlots.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleSlots.map((slot) => {
                      const isSelected = selectedTime === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => handleTimeSelect(slot.startTime)}
                          disabled={isBooking}
                          aria-pressed={isSelected}
                          className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Review your appointment
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  {service.name}
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-600">Date</span>
                    <span className="text-right text-sm font-semibold text-slate-900">
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-600">Time</span>
                    <span className="text-right text-sm font-semibold text-slate-900">
                      {selectedSlot.startTime} – {selectedSlot.endTime}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-600">Duration</span>
                    <span className="text-right text-sm font-semibold text-slate-900">
                      {service.duration} minutes
                    </span>
                  </div>

                  {service.owner && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-slate-600">Provider</span>
                      <span className="text-right text-sm font-semibold text-slate-900">
                        {service.owner.name}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900">
                        Total price
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        ${service.price}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Please review the details before confirming your booking.
                </p>
              </div>
            )}

            {bookingError && (
              <div
                role="alert"
                className="mt-6 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200"
              >
                <p className="text-sm text-amber-900">{bookingError}</p>
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={handleBooking}
                disabled={
                  isBooking ||
                  isLoadingSlots ||
                  !date ||
                  !selectedSlot ||
                  !!slotsError
                }
                className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBooking ? "Confirming booking..." : "Confirm booking"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Booking;
