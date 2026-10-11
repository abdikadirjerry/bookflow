import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerDashboardStats } from "../services/userService";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getOwnerDashboardStats();
      setStats(data.stats || {});
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load dashboard statistics. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statCards = useMemo(
    () => [
      {
        label: "Services",
        value: stats?.totalServices ?? 0,
        description: "Active services",
      },
      {
        label: "Bookings",
        value: stats?.totalBookings ?? 0,
        description: "Total bookings",
      },
      {
        label: "Customers",
        value: stats?.totalCustomers ?? 0,
        description: "Customers served",
      },
      {
        label: "Upcoming",
        value: stats?.upcomingBookings ?? 0,
        description: "Upcoming appointments",
      },
    ],
    [stats],
  );

  const formatNumber = (value) =>
    new Intl.NumberFormat().format(Number(value) || 0);

  const formatPercent = (value) => `${(Number(value) || 0).toFixed(1)}%`;

  // These values are displayed only if the existing API returns them.
  const completedBookings = Number(stats?.completedBookings ?? 0);
  const pendingBookings = Number(stats?.pendingBookings ?? 0);
  const confirmedBookings = Number(stats?.confirmedBookings ?? 0);
  const cancelledBookings = Number(stats?.cancelledBookings ?? 0);
  const totalBookings = Number(stats?.totalBookings ?? 0);

  const completionRate =
    totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  const hasStatusStats = [
    "pendingBookings",
    "confirmedBookings",
    "completedBookings",
    "cancelledBookings",
  ].some((key) => stats?.[key] !== undefined);

  const hasRevenueStats = stats?.totalRevenue !== undefined;

  const statusCards = [
    {
      label: "Pending",
      value: pendingBookings,
      color: "text-amber-700",
      background: "bg-amber-50",
    },
    {
      label: "Confirmed",
      value: confirmedBookings,
      color: "text-blue-700",
      background: "bg-blue-50",
    },
    {
      label: "Completed",
      value: completedBookings,
      color: "text-green-700",
      background: "bg-green-50",
    },
    {
      label: "Cancelled",
      value: cancelledBookings,
      color: "text-red-700",
      background: "bg-red-50",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              BookFlow
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>

            <p className="mt-3 max-w-2xl text-slate-600">
              Manage your services, appointments, and customers from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardStats}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh dashboard"}
          </button>
        </div>

        {isLoading && (
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 p-6 ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              Dashboard unavailable
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchDashboardStats}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && stats && (
          <>
            <section aria-label="Dashboard statistics">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                  <article
                    key={stat.label}
                    className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                  >
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {formatNumber(stat.value)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {stat.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {hasStatusStats && (
              <section className="mt-8">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Booking overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Track the status of your appointments.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {statusCards.map((card) => (
                    <article
                      key={card.label}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-600">
                          {card.label}
                        </p>
                        <span
                          className={`rounded-lg px-3 py-1 text-xs font-semibold ${card.background} ${card.color}`}
                        >
                          {card.label}
                        </span>
                      </div>

                      <p className="mt-4 text-3xl font-bold text-slate-900">
                        {formatNumber(card.value)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {(hasRevenueStats || hasStatusStats) && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Business performance
                </h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {hasRevenueStats && (
                    <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <p className="text-sm font-medium text-slate-500">
                        Completed booking revenue
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: stats.currency || "USD",
                          maximumFractionDigits: 2,
                        }).format(Number(stats.totalRevenue) || 0)}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Based on the revenue value returned by your API.
                      </p>
                    </article>
                  )}

                  {hasStatusStats && (
                    <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-500">
                          Booking completion rate
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {formatPercent(completionRate)}
                        </p>
                      </div>

                      <div
                        className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label="Booking completion rate"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(
                          100,
                          Math.max(0, completionRate),
                        )}
                      >
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, completionRate),
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        {formatNumber(completedBookings)} completed out of{" "}
                        {formatNumber(totalBookings)} total bookings.
                      </p>
                    </article>
                  )}
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">
                Manage your business
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  to="/owner/services"
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-slate-900">Services</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Create, update, and manage the services your business
                    offers.
                  </p>
                  <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                    Manage services →
                  </span>
                </Link>

                <Link
                  to="/owner/bookings"
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-slate-900">Bookings</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Search appointments, manage statuses, and review bookings.
                  </p>
                  <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                    Manage bookings →
                  </span>
                </Link>

                <Link
                  to="/owner/customers"
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-slate-900">
                    Customers
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    View customers who have booked your services.
                  </p>
                  <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                    View customers →
                  </span>
                </Link>

                <Link
                  to="/owner/availability"
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-slate-900">
                    Availability
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Set the days and hours when customers can book appointments.
                  </p>
                  <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                    Manage availability →
                  </span>
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default Dashboard;
