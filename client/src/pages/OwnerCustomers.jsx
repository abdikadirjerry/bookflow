import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getOwnerCustomers } from "../services/userService";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageHeader from "../components/ui/PageHeader";

function OwnerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("most-bookings");

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchCustomers = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError("");

    try {
      const data = await getOwnerCustomers();

      if (!Array.isArray(data?.customers)) {
        throw new Error("The server returned an invalid customers response.");
      }

      const nextCustomers = data.customers;

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setCustomers(nextCustomers);
      setCount(
        Number.isFinite(Number(data.count))
          ? Number(data.count)
          : nextCustomers.length,
      );
    } catch (requestError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load customers. Please try again.",
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCustomers();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
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

  const clearFilters = () => {
    setSearch("");
    setSortOrder("most-bookings");
  };

  const hasActiveFilters =
    search.trim() !== "" || sortOrder !== "most-bookings";

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
            title="Customers"
            description="View and search customers who have booked your services."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={fetchCustomers}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh customers"}
              </Button>
            }
          />
        </div>

        {!isLoading && !error && (
          <section
            aria-label="Customer statistics"
            className="mb-6 grid gap-4 sm:grid-cols-2"
          >
            <Card>
              <p className="text-sm font-medium text-slate-500">
                Total customers
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
            </Card>

            <Card>
              <p className="text-sm font-medium text-slate-500">
                Bookings from listed customers
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalBookings}
              </p>
            </Card>
          </section>
        )}

        {isLoading && (
          <Card>
            <div role="status" aria-live="polite" className="py-8 text-center">
              <p className="text-slate-600">Loading customers...</p>
            </div>
          </Card>
        )}

        {!isLoading && error && (
          <Card>
            <div role="alert">
              <h2 className="font-semibold text-red-800">
                Unable to load customers
              </h2>

              <p className="mt-2 text-sm text-red-700">{error}</p>

              <div className="mt-4">
                <Button type="button" onClick={fetchCustomers}>
                  Try again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && !error && customers.length === 0 && (
          <Card>
            <div className="py-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                No customers yet
              </h2>
              <p className="mt-2 text-slate-600">
                Customers will appear here after they book one of your services.
              </p>
            </div>
          </Card>
        )}

        {!isLoading && !error && customers.length > 0 && (
          <>
            <Card>
              <section
                aria-label="Search and sort customers"
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customer-search"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Search customers
                    </label>

                    <Input
                      id="customer-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name or email..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-sort"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Sort customers
                    </label>

                    <select
                      id="customer-sort"
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="most-bookings">Most bookings first</option>
                      <option value="fewest-bookings">
                        Fewest bookings first
                      </option>
                      <option value="name">Name (A–Z)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500" aria-live="polite">
                    Showing {filteredCustomers.length} of {customers.length}{" "}
                    loaded customers
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

            <div className="mt-5">
              {filteredCustomers.length === 0 ? (
                <Card>
                  <div className="py-6 text-center">
                    <h2 className="text-xl font-bold text-slate-900">
                      No matching customers
                    </h2>

                    <p className="mt-2 text-slate-600">
                      Try searching with a different name or email.
                    </p>

                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="-mx-5 overflow-x-auto sm:-mx-6">
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

                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredCustomers.map((customer, index) => {
                          const bookingCount =
                            Number(customer.bookingCount) || 0;

                          const customerId =
                            customer.id ??
                            customer._id ??
                            customer.email ??
                            `${customer.name || "customer"}-${index}`;

                          return (
                            <tr
                              key={customerId}
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
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
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
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default OwnerCustomers;
