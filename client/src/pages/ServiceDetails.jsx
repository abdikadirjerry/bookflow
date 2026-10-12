import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServiceById } from "../services/serviceService";

function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "Price unavailable";

  return `$${amount.toFixed(2)}`;
}

function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchService = async () => {
    setIsLoading(true);
    setError("");
    setService(null);

    try {
      const data = await getServiceById(serviceId);

      if (!data?.service) {
        setError("The service could not be found. It may have been removed.");
        return;
      }

      setService(data.service);
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 404) {
        setError("This service no longer exists or is unavailable.");
      } else if (!requestError.response) {
        setError(
          "Unable to connect to the server. Check your connection and try again.",
        );
      } else {
        setError(
          requestError.response?.data?.message ||
            "Unable to load this service. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadService = async () => {
      setIsLoading(true);
      setError("");
      setService(null);

      try {
        const data = await getServiceById(serviceId);

        if (!isActive) return;

        if (!data?.service) {
          setError("The service could not be found. It may have been removed.");
          return;
        }

        setService(data.service);
      } catch (requestError) {
        if (!isActive) return;

        const status = requestError.response?.status;

        if (status === 404) {
          setError("This service no longer exists or is unavailable.");
        } else if (!requestError.response) {
          setError(
            "Unable to connect to the server. Check your connection and try again.",
          );
        } else {
          setError(
            requestError.response?.data?.message ||
              "Unable to load this service. Please try again.",
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadService();

    return () => {
      isActive = false;
    };
  }, [serviceId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10" aria-busy="true">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/services"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to services
          </Link>

          <div
            role="status"
            className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"
              aria-hidden="true"
            />
            <p className="mt-4 text-slate-600">Loading service details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !service) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/services"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to services
          </Link>

          <section className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-700"
              aria-hidden="true"
            >
              !
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Service unavailable
            </h1>

            <p role="alert" className="mt-2 text-slate-600">
              {error || "The service you are looking for does not exist."}
            </p>

            {error && (
              <button
                type="button"
                onClick={fetchService}
                className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Try again
              </button>
            )}

            <Link
              to="/services"
              className="mt-6 inline-block rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Back to services
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const serviceName =
    typeof service.name === "string" && service.name.trim()
      ? service.name
      : "Untitled service";

  const description =
    typeof service.description === "string" && service.description.trim()
      ? service.description
      : "No description is available for this service.";

  const duration = Number(service.duration);
  const validDuration = Number.isFinite(duration) && duration > 0;

  const ownerName =
    typeof service.owner?.name === "string" && service.owner.name.trim()
      ? service.owner.name
      : "";

  const bookingServiceId = service._id || serviceId;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/services"
          className="mb-6 inline-block text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back to services
        </Link>

        <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Service details
                </p>

                <h1 className="mt-2 break-words text-3xl font-bold text-slate-900 sm:text-4xl">
                  {serviceName}
                </h1>

                {service.category && (
                  <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {service.category}
                  </span>
                )}
              </div>

              <div className="shrink-0 rounded-xl bg-slate-100 px-5 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Price
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatPrice(service.price)}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                About this service
              </h2>

              <p className="mt-3 whitespace-pre-line break-words leading-7 text-slate-600">
                {description}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Duration</p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {validDuration ? `${duration} minutes` : "Not specified"}
                </p>
              </div>

              {ownerName && (
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Provided by
                  </p>

                  <p className="mt-1 break-words text-lg font-semibold text-slate-900">
                    {ownerName}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <button
                type="button"
                disabled={!bookingServiceId}
                onClick={() => navigate(`/services/${bookingServiceId}/book`)}
                className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Book this service
              </button>

              <p className="mt-3 text-sm text-slate-500">
                Review your booking details before confirming your appointment.
              </p>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

export default ServiceDetails;
