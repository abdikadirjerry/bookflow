import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteService, getServices } from "../services/serviceService";

function OwnerServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [deactivatingServiceId, setDeactivatingServiceId] = useState(null);
  const [deactivateError, setDeactivateError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getServices();

        setServices(data.services || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load your services. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleDeactivate = async (serviceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this service? Customers will no longer be able to book it.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingServiceId(serviceId);
      setDeactivateError("");

      await deleteService(serviceId);

      setServices((currentServices) =>
        currentServices.map((service) =>
          service._id === serviceId
            ? {
                ...service,
                isActive: false,
              }
            : service,
        ),
      );
    } catch (error) {
      setDeactivateError(
        error.response?.data?.message ||
          "Unable to deactivate this service. Please try again.",
      );
    } finally {
      setDeactivatingServiceId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Business management
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                My services
              </h1>

              <p className="mt-3 max-w-2xl text-slate-600">
                Manage the services your customers can book.
              </p>
            </div>

            <Link
              to="/owner/services/new"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Create service
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading your services...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-6 ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Unable to load services
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && deactivateError && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
          >
            <p className="text-sm text-red-700">{deactivateError}</p>
          </div>
        )}

        {!isLoading && !error && services.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              No services yet
            </h2>

            <p className="mt-2 text-slate-600">
              Create your first service so customers can start booking
              appointments.
            </p>

            <Link
              to="/owner/services/new"
              className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Create your first service
            </Link>
          </div>
        )}

        {!isLoading && !error && services.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const isDeactivating = deactivatingServiceId === service._id;

              return (
                <article
                  key={service._id}
                  className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-bold text-slate-900">
                        {service.name}
                      </h2>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          service.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5">
                      <div>
                        <p className="text-sm text-slate-500">Price</p>

                        <p className="mt-1 font-semibold text-slate-900">
                          ${service.price}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Duration</p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {service.duration} min
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 border-t border-slate-200 pt-5">
                    <Link
                      to={`/owner/services/${service._id}/edit`}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                    >
                      Edit
                    </Link>

                    {service.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(service._id)}
                        disabled={isDeactivating}
                        className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeactivating ? "Deactivating..." : "Deactivate"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default OwnerServices;
