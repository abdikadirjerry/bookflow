import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServiceById } from "../services/serviceService";
import { createBooking, getAvailableSlots } from "../services/bookingService";

function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

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

  useEffect(() => {
    let isActive = true;

    const fetchService = async () => {
      try {
        setIsLoadingService(true);
        setServiceError("");

        const data = await getServiceById(serviceId);

        if (isActive) {
          setService(data.service);
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
    };

    fetchService();

    return () => {
      isActive = false;
    };
  }, [serviceId]);

  const loadAvailableSlots = useCallback(
    async ({ preserveBookingError = false } = {}) => {
      if (!date) {
        setAvailableSlots([]);
        setSelectedTime("");
        setSlotsError("");

        if (!preserveBookingError) {
          setBookingError("");
        }

        return false;
      }

      try {
        setIsLoadingSlots(true);
        setSlotsError("");

        if (!preserveBookingError) {
          setBookingError("");
        }

        const data = await getAvailableSlots(serviceId, date);
        const slots = data.slots || [];

        setAvailableSlots(slots);

        return true;
      } catch (error) {
        setAvailableSlots([]);

        setSlotsError(
          error.response?.data?.message ||
            "Unable to load available times. Please try again.",
        );

        return false;
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [date, serviceId],
  );

  useEffect(() => {
    let isActive = true;

    const fetchAvailableSlots = async () => {
      if (!date) {
        setAvailableSlots([]);
        setSelectedTime("");
        setSlotsError("");
        setBookingError("");
        return;
      }

      setSelectedTime("");

      try {
        setIsLoadingSlots(true);
        setSlotsError("");
        setBookingError("");

        const data = await getAvailableSlots(serviceId, date);

        if (isActive) {
          setAvailableSlots(data.slots || []);
        }
      } catch (error) {
        if (isActive) {
          setAvailableSlots([]);

          setSlotsError(
            error.response?.data?.message ||
              "Unable to load available times. Please try again.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingSlots(false);
        }
      }
    };

    fetchAvailableSlots();

    return () => {
      isActive = false;
    };
  }, [serviceId, date]);

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setSelectedTime("");
    setBookingError("");
    setSlotsError("");
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setBookingError("");
  };

  const handleBooking = async () => {
    if (!date) {
      setBookingError("Please select a date.");
      return;
    }

    if (!selectedTime) {
      setBookingError("Please select an available time.");
      return;
    }

    try {
      setIsBooking(true);
      setBookingError("");

      await createBooking({
        serviceId,
        date,
        startTime: selectedTime,
      });

      navigate("/bookings");
    } catch (error) {
      if (error.response?.status === 409) {
        setSelectedTime("");
        setBookingError(
          "Sorry, this time slot was just booked by someone else. We've refreshed the available times. Please choose another time.",
        );

        await loadAvailableSlots({ preserveBookingError: true });
      } else {
        setBookingError(
          error.response?.data?.message ||
            "Unable to create your booking. Please try again.",
        );
      }
    } finally {
      setIsBooking(false);
    }
  };

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

            <p className="mt-2 text-red-700">
              {serviceError || "This service could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

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
                min={new Date().toISOString().split("T")[0]}
                disabled={isBooking}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {date && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Available times
                  </h3>

                  {!isLoadingSlots && !slotsError && (
                    <span className="text-sm text-slate-500">
                      {
                        availableSlots.filter(
                          (slot) => slot.available !== false,
                        ).length
                      }{" "}
                      available
                    </span>
                  )}
                </div>

                {isLoadingSlots && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center">
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
                      className="mt-3 text-sm font-semibold text-red-800 underline hover:text-red-950"
                    >
                      Try loading times again
                    </button>
                  </div>
                )}

                {!isLoadingSlots &&
                  !slotsError &&
                  availableSlots.filter((slot) => slot.available !== false)
                    .length === 0 && (
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

                {!isLoadingSlots &&
                  !slotsError &&
                  availableSlots.some((slot) => slot.available !== false) && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {availableSlots
                        .filter((slot) => slot.available !== false)
                        .map((slot) => {
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
                  !selectedTime ||
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
