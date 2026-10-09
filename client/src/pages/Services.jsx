import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getServices } from "../services/serviceService";

function Services() {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getServices();

        setServices(data.services);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load services. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return services.filter((service) =>
      service.name.toLowerCase().includes(normalizedSearch),
    );
  }, [services, searchTerm]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            BookFlow
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Discover services
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Browse available services and choose one that works for you.
          </p>
        </div>

        <div className="mb-8">
          <label
            htmlFor="service-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Search services
          </label>

          <input
            id="service-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by service name..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-md"
          />
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading services...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-100"
          >
            <p className="font-medium text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && services.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              No services available
            </h2>

            <p className="mt-2 text-slate-600">
              There are currently no active services to book.
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          services.length > 0 &&
          filteredServices.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                No matching services
              </h2>

              <p className="mt-2 text-slate-600">
                Try another service name or clear your search.
              </p>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-5 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Clear search
              </button>
            </div>
          )}

        {!isLoading && !error && filteredServices.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500" aria-live="polite">
              Showing {filteredServices.length} of {services.length} services
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <article
                  key={service._id}
                  className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-bold text-slate-900">
                        {service.name}
                      </h2>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        ${service.price}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                      <span>{service.duration} minutes</span>

                      {service.owner && (
                        <span>
                          By{" "}
                          <span className="font-medium text-slate-700">
                            {service.owner.name}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/services/${service._id}`}
                    className="mt-6 block rounded-lg bg-slate-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
                  >
                    View service
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Services;
