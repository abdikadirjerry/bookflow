
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { deleteService, getOwnerServices } from "../services/serviceService";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

function OwnerServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deactivatingServiceId, setDeactivatingServiceId] = useState(null);
  const [deactivateError, setDeactivateError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");

  const requestIdRef = useRef(0);
  const deactivatingRef = useRef(false);

  const fetchServices = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError("");

      const data = await getOwnerServices();

      if (requestId !== requestIdRef.current) return;

      if (!Array.isArray(data?.services)) {
        throw new Error("The server returned an invalid services response.");
      }

      setServices(data.services);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load your services. Please try again.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchServices();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchServices]);

  const activeCount = services.filter((service) => service.isActive).length;
  const inactiveCount = services.length - activeCount;

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services
      .filter((service) => {
        const matchesSearch = [service.name, service.description].some(
          (value) => String(value || "").toLowerCase().includes(query),
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
    if (deactivatingRef.current) return;

    const service = services.find((item) => item._id === serviceId);

    if (!service || !service.isActive) return;

    const confirmed = window.confirm(
      "Are you sure you want to deactivate this service? Customers will no longer be able to book it.",
    );

    if (!confirmed) return;

    deactivatingRef.current = true;

    try {
      setDeactivatingServiceId(serviceId);
      setDeactivateError("");

      await deleteService(serviceId);

      setServices((currentServices) =>
        currentServices.map((item) =>
          item._id === serviceId ? { ...item, isActive: false } : item,
        ),
      );
    } catch (requestError) {
      setDeactivateError(
        requestError.response?.data?.message ||
          "Unable to deactivate this service. Please try again.",
      );
    } finally {
      deactivatingRef.current = false;
      setDeactivatingServiceId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("name");
  };

  const hasActiveFilters =
    Boolean(search) || statusFilter !== "all" || sortOrder !== "name";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-5">
          <PageHeader
            eyebrow="Business management"
            title="My services"
            description="Manage the services your customers can book."
            action={
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchServices}
                  disabled={isLoading || Boolean(deactivatingServiceId)}
                >
                  {isLoading ? "Loading..." : "Refresh"}
                </Button>

                <Button as={Link} to="/owner/services/new">
                  Create service
                </Button>
              </div>
            }
          />
        </div>

        {!isLoading && !error && (
          <section
            aria-label="Service statistics"
            className="mb-6 grid gap-4 sm:grid-cols-3"
          >
            <Card>
              <p className="text-sm font-medium text-slate-500">
                Total services
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {services.length}
              </p>
            </Card>

            <Card>
              <p className="text-sm font-medium text-slate-500">
                Active services
              </p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {activeCount}
              </p>
            </Card>

            <Card>
              <p className="text-sm font-medium text-slate-500">
                Inactive services
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-700">
                {inactiveCount}
              </p>
            </Card>
          </section>
        )}

        {error && (
          <Card>
            <div role="alert">
              <h2 className="font-semibold text-red-800">
                Unable to load services
              </h2>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={fetchServices}
                  disabled={isLoading}
                >
                  Try again
                </Button>
              </div>
            </div>
          </Card>
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
          <Card>
            <div role="status" className="py-5 text-center">
              <p className="text-slate-600">Loading your services...</p>
            </div>
          </Card>
        )}

        {!isLoading && !error && services.length === 0 && (
          <Card>
            <div className="py-5 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                No services yet
              </h2>
              <p className="mt-2 text-slate-600">
                Create your first service so customers can start booking
                appointments.
              </p>
              <div className="mt-6">
                <Button as={Link} to="/owner/services/new">
                  Create your first service
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && !error && services.length > 0 && (
          <>
            <Card>
              <section aria-label="Service filters" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="service-search"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Search services
                    </label>
                    <Input
                      id="service-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name or description..."
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="name">Name (A–Z)</option>
                      <option value="price-low">Price (low to high)</option>
                      <option value="price-high">Price (high to low)</option>
                      <option value="duration">Shortest duration</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    Showing {filteredServices.length} of {services.length}{" "}
                    services
                  </p>

                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </section>
            </Card>

            <div className="mt-6">
              {filteredServices.length === 0 ? (
                <Card>
                  <div className="py-5 text-center">
                    <h2 className="text-xl font-bold text-slate-900">
                      No matching services
                    </h2>
                    <p className="mt-2 text-slate-600">
                      Try changing your search or status filter.
                    </p>
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service) => {
                    const isDeactivating =
                      deactivatingServiceId === service._id;

                    return (
                      <Card key={service._id}>
                        <article className="flex h-full flex-col">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <h2 className="text-xl font-bold text-slate-900">
                                {service.name || "Untitled service"}
                              </h2>

                              <StatusBadge
                                status={service.isActive ? "active" : "inactive"}
                              />
                            </div>

                            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                              {service.description ||
                                "No description provided."}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5">
                              <div>
                                <p className="text-sm text-slate-500">Price</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  $
                                  {Number.isFinite(Number(service.price))
                                    ? Number(service.price).toFixed(2)
                                    : "0.00"}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-slate-500">
                                  Duration
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {service.duration ?? "—"} min
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 flex gap-3 border-t border-slate-200 pt-5">
                            <Button
                              as={Link}
                              to={`/owner/services/${service._id}/edit`}
                              variant="secondary"
                              className="flex-1"
                            >
                              Edit
                            </Button>

                            {service.isActive && (
                              <Button
                                type="button"
                                variant="danger"
                                className="flex-1"
                                onClick={() => handleDeactivate(service._id)}
                                disabled={Boolean(deactivatingServiceId)}
                              >
                                {isDeactivating
                                  ? "Deactivating..."
                                  : "Deactivate"}
                              </Button>
                            )}
                          </div>
                        </article>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default OwnerServices;
