import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getServices } from "../services/serviceService";

const SERVICE_CATEGORIES = [
  "Beauty & Personal Care",
  "Photography",
  "Home Services",
  "Tutoring",
  "Other",
];

const SERVICES_PER_PAGE = 6;

function Services() {
  const [services, setServices] = useState([]);
  const [owners, setOwners] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the provider options independently of the active filters.
  useEffect(() => {
    let cancelled = false;

    const fetchOwners = async () => {
      try {
        const data = await getServices({ page: 1, limit: 100 });

        if (cancelled) return;

        const ownerMap = new Map();

        data.services.forEach((service) => {
          if (service.owner?._id && service.owner?.name) {
            ownerMap.set(service.owner._id, service.owner.name);
          }
        });

        setOwners(
          Array.from(ownerMap, ([id, name]) => ({ id, name })).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } catch (fetchError) {
        if (!cancelled) {
          console.error("Unable to load provider options:", fetchError);
        }
      }
    };

    fetchOwners();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch only the requested page and let the backend apply filters and sorting.
  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError("");

        const params = {
          page: currentPage,
          limit: SERVICES_PER_PAGE,
          sort: sortOrder,
        };

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        if (selectedCategory) {
          params.category = selectedCategory;
        }

        if (selectedOwnerId) {
          params.owner = selectedOwnerId;
        }

        if (minPrice !== "") {
          params.minPrice = minPrice;
        }

        if (maxPrice !== "") {
          params.maxPrice = maxPrice;
        }

        const data = await getServices(params);

        if (cancelled) return;

        setServices(data.services);
        setTotalServices(data.pagination.totalServices);
        setTotalPages(data.pagination.totalPages);
      } catch (fetchError) {
        if (cancelled) return;

        setServices([]);
        setTotalServices(0);
        setTotalPages(0);
        setError(
          fetchError.response?.data?.message ||
            "Unable to load services. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    searchTerm,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedOwnerId,
    sortOrder,
  ]);

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedOwnerId("");
    setSortOrder("default");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedCategory !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    selectedOwnerId !== "" ||
    sortOrder !== "default";

  const startIndex =
    totalServices === 0 ? 0 : (currentPage - 1) * SERVICES_PER_PAGE + 1;

  const endIndex = Math.min(currentPage * SERVICES_PER_PAGE, totalServices);

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

        <div className="mb-8 grid gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 sm:p-6">
          <div>
            <label
              htmlFor="service-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search by name
            </label>
            <input
              id="service-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                updateFilter(setSearchTerm, event.target.value)
              }
              placeholder="e.g. Haircut"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="category-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Filter by category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) =>
                updateFilter(setSelectedCategory, event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All categories</option>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="provider-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Filter by provider
            </label>
            <select
              id="provider-filter"
              value={selectedOwnerId}
              onChange={(event) =>
                updateFilter(setSelectedOwnerId, event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All providers</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="min-price"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Minimum price ($)
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(event) =>
                updateFilter(setMinPrice, event.target.value)
              }
              placeholder="e.g. 20"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="max-price"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Maximum price ($)
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(event) =>
                updateFilter(setMaxPrice, event.target.value)
              }
              placeholder="e.g. 50"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="sort-order"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Sort services by price
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(event) =>
                updateFilter(setSortOrder, event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-md"
            >
              <option value="default">Default order</option>
              <option value="low-to-high">Price: Low to high</option>
              <option value="high-to-low">Price: High to low</option>
            </select>

            <div className="mt-4">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
          </div>
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
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page)}
              className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && totalServices === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              {hasActiveFilters
                ? "No matching services"
                : "No services available"}
            </h2>
            <p className="mt-2 text-slate-600">
              {hasActiveFilters
                ? "Try changing your search, category, provider, or price range."
                : "There are currently no active services to book."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && totalServices > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500" aria-live="polite">
              Showing {startIndex}–{endIndex} of {totalServices} matching
              services
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
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

                    <span className="mt-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {SERVICE_CATEGORIES.includes(service.category)
                        ? service.category
                        : "Other"}
                    </span>

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

            {totalPages > 1 && (
              <nav
                aria-label="Service pages"
                className="mt-8 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default Services;
