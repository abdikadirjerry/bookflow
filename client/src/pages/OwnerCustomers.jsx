import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerCustomers } from "../services/userService";

function OwnerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getOwnerCustomers();

        setCustomers(data.customers || []);
        setCount(data.count || 0);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load customers. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Customers
                </h1>

                <p className="mt-3 max-w-2xl text-slate-600">
                  View the customers who have booked your services.
                </p>
              </div>

              {!isLoading && !error && (
                <div className="rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Total customers</p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading customers...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-6 ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Unable to load customers
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>
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
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bookings
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-5">
                        <p className="font-semibold text-slate-900">
                          {customer.name}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="break-all text-sm text-slate-600">
                          {customer.email}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {customer.bookingCount}{" "}
                          {customer.bookingCount === 1 ? "booking" : "bookings"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default OwnerCustomers;
