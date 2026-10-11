import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerCustomers } from "../services/userService";

function OwnerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("most-bookings");

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getOwnerCustomers();

      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
      setCount(Number(data?.count) || 0);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load customers. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        if (!query) return true;

        return [customer.name, customer.email].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      })
      .sort((a, b) => {
        const bookingsA = Number(a.bookingCount) || 0;
        const bookingsB = Number(b.bookingCount) || 0;

        if (sortOrder === "most-bookings") {
          return bookingsB - bookingsA;
        }

        if (sortOrder === "fewest-bookings") {
          return bookingsA - bookingsB;
        }

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [customers, search, sortOrder]);

  const totalBookings = useMemo(
    () =>
      customers.reduce(
        (total, customer) => total + (Number(customer.bookingCount) || 0),
        0,
      ),
    [customers],
  );

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

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Business management
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Customers
                </h1>

                <p className="mt-3 max-w-2xl text-slate-600">
                  View and search customers who have booked your services.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCustomers}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Refresh customers"}
              </button>
            </div>
          </div>
        </div>

        {!isLoading && !error && (
          <section
            aria-label="Customer statistics"
            className="mb-6 grid gap-4 sm:grid-cols-2"
          >
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">
                Total customers
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">
                Bookings from listed customers
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalBookings}
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
              Unable to load customers
            </h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchCustomers}
              disabled={isLoading}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading && (
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading customers...</p>
          </div>
        )}

        {!isLoading && !error && customers.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              No customers yet
            </h2>
            <p className="mt-2 text-slate-600">
              Customers will appear here after they book one of your services.
            </p>
          </div>
        )}

        {!isLoading && !error && customers.length > 0 && (
          <>
            <section
              aria-label="Search and sort customers"
              className="mb-5 grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="customer-search"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Search customers
                </label>
                <input
                  id="customer-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-sort"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Sort customers
                </label>
                <select
                  id="customer-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="most-bookings">Most bookings first</option>
                  <option value="fewest-bookings">Fewest bookings first</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <p className="text-sm text-slate-500">
                  Showing {filteredCustomers.length} of {customers.length}{" "}
                  loaded customers
                </p>

                {(search || sortOrder !== "most-bookings") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSortOrder("most-bookings");
                    }}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </section>

            {filteredCustomers.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  No matching customers
                </h2>
                <p className="mt-2 text-slate-600">
                  Try searching with a different name or email.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          Customer
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          Bookings
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {filteredCustomers.map((customer) => {
                        const bookingCount = Number(customer.bookingCount) || 0;

                        return (
                          <tr
                            key={customer.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-6 py-5">
                              <p className="font-semibold text-slate-900">
                                {customer.name || "Unnamed customer"}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <p className="break-all text-sm text-slate-600">
                                {customer.email || "No email provided"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-6 py-5">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                {bookingCount}{" "}
                                {bookingCount === 1 ? "booking" : "bookings"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default OwnerCustomers;
