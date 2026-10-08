import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServiceById } from "../services/serviceService";

function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getServiceById(serviceId);

        setService(data.service);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load this service. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  if (isLoading) {
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

  if (error) {
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

            <p className="mt-2 text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => navigate("/services")}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Back to services
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h1 className="text-xl font-bold text-slate-900">
              Service not found
            </h1>

            <p className="mt-2 text-slate-600">
              The service you are looking for does not exist.
            </p>

            <Link
              to="/services"
              className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Back to services
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Service details
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                  {service.name}
                </h1>
              </div>

              <div className="shrink-0 rounded-xl bg-slate-100 px-5 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Price
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ${service.price}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                About this service
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {service.description}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Duration</p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {service.duration} minutes
                </p>
              </div>

              {service.owner && (
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Provided by
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {service.owner.name}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <button
                type="button"
                onClick={() => navigate(`/services/${service._id}/book`)}
                className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 sm:w-auto"
              >
                Book this service
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

export default ServiceDetails;
