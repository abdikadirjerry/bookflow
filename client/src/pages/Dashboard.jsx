import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerDashboardStats } from "../services/userService";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = [
  {
    key: "pendingBookings",
    label: "Pending",
    color: "text-amber-700",
    background: "bg-amber-50",
  },
  {
    key: "confirmedBookings",
    label: "Confirmed",
    color: "text-blue-700",
    background: "bg-blue-50",
  },
  {
    key: "completedBookings",
    label: "Completed",
    color: "text-green-700",
    background: "bg-green-50",
  },
  {
    key: "cancelledBookings",
    label: "Cancelled",
    color: "text-red-700",
    background: "bg-red-50",
  },
];

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(toNumber(value));
}

function formatPercent(value) {
  return `${toNumber(value).toFixed(1)}%`;
}

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency:
        typeof currency === "string" && currency.trim()
          ? currency.trim().toUpperCase()
          : "USD",
      maximumFractionDigits: 2,
    }).format(toNumber(value));
  } catch {
    return formatNumber(value);
  }
}

function getStatsFromResponse(response) {
  const candidate =
    response?.stats ?? response?.data?.stats ?? response?.data ?? response;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new Error("The dashboard returned an unexpected response.");
  }

  return candidate;
}

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const hasStatsRef = useRef(false);

  const fetchDashboardStats = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const hasExistingStats = hasStatsRef.current;

    if (hasExistingStats) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await getOwnerDashboardStats();
      const nextStats = getStatsFromResponse(response);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setStats(nextStats);
      hasStatsRef.current = true;
    } catch (requestError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load dashboard statistics. Please try again.",
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboardStats();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchDashboardStats]);

  const statCards = useMemo(
    () => [
      {
        label: "Services",
        value: stats?.activeServices,
        description: "Active services",
      },
      {
        label: "Bookings",
        value: stats?.totalBookings,
        description: "Total bookings",
      },
      {
        label: "Customers",
        value: stats?.totalCustomers,
        description: "Customers served",
      },
      {
        label: "Upcoming",
        value: stats?.upcomingBookings,
        description: "Upcoming appointments",
      },
    ],
    [stats],
  );

  const totalBookings = toNumber(stats?.totalBookings);
  const completedBookings = toNumber(stats?.completedBookings);

  const completionRate =
    totalBookings > 0
      ? Math.min(100, Math.max(0, (completedBookings / totalBookings) * 100))
      : 0;

  const hasStatusStats = STATUS_CONFIG.some(
    ({ key }) => stats?.[key] !== undefined && stats?.[key] !== null,
  );

  const hasRevenueStats =
    stats?.totalRevenue !== undefined &&
    stats?.totalRevenue !== null &&
    Number.isFinite(Number(stats.totalRevenue));

  if (isLoading && !stats) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="font-medium text-slate-800">Loading dashboard...</p>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we load your business statistics.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
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
            disabled={isRefreshing || isLoading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing || isLoading ? "Refreshing..." : "Refresh dashboard"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl bg-red-50 p-5 ring-1 ring-red-100"
          >
            <h2 className="font-semibold text-red-800">
              {stats ? "Dashboard refresh failed" : "Dashboard unavailable"}
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchDashboardStats}
              disabled={isRefreshing || isLoading}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              Try again
            </button>

            {stats && (
              <p className="mt-3 text-sm text-red-700">
                Your previously loaded statistics are still displayed.
              </p>
            )}
          </div>
        )}

        {stats && (
          <>
            {isRefreshing && (
              <p role="status" className="mb-4 text-sm text-slate-500">
                Updating dashboard statistics...
              </p>
            )}

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
                  {STATUS_CONFIG.map((card) => (
                    <article
                      key={card.key}
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
                        {formatNumber(stats[card.key])}
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
                        {formatCurrency(stats.totalRevenue, stats.currency)}
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
                        aria-valuenow={completionRate}
                      >
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${completionRate}%` }}
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
