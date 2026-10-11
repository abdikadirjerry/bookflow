import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteService, getOwnerServices } from "../services/serviceService";

function OwnerServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deactivatingServiceId, setDeactivatingServiceId] = useState(null);
  const [deactivateError, setDeactivateError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getOwnerServices();
      setServices(Array.isArray(data?.services) ? data.services : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load your services. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const activeCount = services.filter((service) => service.isActive).length;
  const inactiveCount = services.length - activeCount;

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services
      .filter((service) => {
        const matchesSearch = [service.name, service.description].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
        );

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && service.isActive) ||
          (statusFilter === "inactive" && !service.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === "price-low") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }

        if (sortOrder === "price-high") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }

        if (sortOrder === "duration") {
          return (Number(a.duration) || 0) - (Number(b.duration) || 0);
        }

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [services, search, statusFilter, sortOrder]);

  const handleDeactivate = async (serviceId) => {
    if (deactivatingServiceId) return;

    const confirmed = window.confirm(
      "Are you sure you want to deactivate this service? Customers will no longer be able to book it.",
    );

    if (!confirmed) return;

    try {
      setDeactivatingServiceId(serviceId);
      setDeactivateError("");

      await deleteService(serviceId);

      setServices((currentServices) =>
        currentServices.map((service) =>
          service._id === serviceId ? { ...service, isActive: false } : service,
        ),
      );
    } catch (requestError) {
      setDeactivateError(
        requestError.response?.data?.message ||
          "Unable to deactivate this service. Please try again.",
      );
    } finally {
      setDeactivatingServiceId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("name");
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

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchServices}
                disabled={isLoading || Boolean(deactivatingServiceId)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>

              <Link
                to="/owner/services/new"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Create service
              </Link>
            </div>
          </div>
        </div>

        {!isLoading && !error && (
          <section
            aria-label="Service statistics"
            className="mb-6 grid gap-4 sm:grid-cols-3"
          >
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">
                Total services
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {services.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">
                Active services
              </p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">
                Inactive services
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-700">
                {inactiveCount}
              </p>
            </div>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl bg-red-50 p-6 ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Unable to load services
            </h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchServices}
              disabled={isLoading}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        {deactivateError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
          >
            <p className="text-sm text-red-700">{deactivateError}</p>
            <button
              type="button"
              onClick={() => setDeactivateError("")}
              aria-label="Dismiss error"
              className="font-bold text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {isLoading && (
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading your services...</p>
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
          <>
            <section
              aria-label="Service filters"
              className="mb-6 grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="service-search"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Search services
                </label>
                <input
                  id="service-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or description..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="service-status"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>
                <select
                  id="service-status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="all">All services</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="service-sort"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Sort by
                </label>
                <select
                  id="service-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="name">Name (A–Z)</option>
                  <option value="price-low">Price (low to high)</option>
                  <option value="price-high">Price (high to low)</option>
                  <option value="duration">Shortest duration</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
                <p className="text-sm text-slate-500">
                  Showing {filteredServices.length} of {services.length}{" "}
                  services
                </p>

                {(search || statusFilter !== "all" || sortOrder !== "name") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </section>

            {filteredServices.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  No matching services
                </h2>
                <p className="mt-2 text-slate-600">
                  Try changing your search or status filter.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => {
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
                          {service.description || "No description provided."}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5">
                          <div>
                            <p className="text-sm text-slate-500">Price</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              ${Number(service.price || 0).toFixed(2)}
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
                            disabled={Boolean(deactivatingServiceId)}
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
          </>
        )}
      </div>
    </main>
  );
}

export default OwnerServices;
