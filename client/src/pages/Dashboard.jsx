import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerDashboardStats } from "../services/userService";
import { getOwnerBookings } from "../services/bookingService";
import { useAuth } from "../context/AuthContext";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

const STATUS_CONFIG = [
  {
    key: "pendingBookings",
    label: "Pending",
  },
  {
    key: "confirmedBookings",
    label: "Confirmed",
  },
  {
    key: "completedBookings",
    label: "Completed",
  },
  {
    key: "cancelledBookings",
    label: "Cancelled",
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

function getBookingsFromResponse(response) {
  const candidate =
    response?.bookings ??
    response?.data?.bookings ??
    response?.data?.data?.bookings;

  if (!Array.isArray(candidate)) {
    throw new Error("The bookings response has an unexpected format.");
  }

  return candidate;
}

function formatBookingDate(date) {
  if (typeof date !== "string" || !date.trim()) return "Date unavailable";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);

  if (match) {
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      parsed.getFullYear() !== Number(year) ||
      parsed.getMonth() !== Number(month) - 1 ||
      parsed.getDate() !== Number(day)
    ) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatBookingTime(time) {
  if (typeof time !== "string") return "Time unavailable";

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) return time || "Time unavailable";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const date = new Date(2000, 0, 1, hours, minutes);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const hasStatsRef = useRef(false);
  const bookingsRequestIdRef = useRef(0);

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

  const fetchRecentBookings = useCallback(async () => {
    const requestId = ++bookingsRequestIdRef.current;

    setBookingsLoading(true);
    setBookingsError("");

    try {
      const response = await getOwnerBookings();
      const bookings = getBookingsFromResponse(response);

      if (!mountedRef.current || requestId !== bookingsRequestIdRef.current) {
        return;
      }

      const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = `${a?.date || ""}T${a?.startTime || "00:00"}`;
        const dateB = `${b?.date || ""}T${b?.startTime || "00:00"}`;

        return dateB.localeCompare(dateA);
      });

      setRecentBookings(sortedBookings.slice(0, 5));
    } catch (requestError) {
      if (!mountedRef.current || requestId !== bookingsRequestIdRef.current) {
        return;
      }

      setBookingsError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load recent bookings. Please try again.",
      );
    } finally {
      if (mountedRef.current && requestId === bookingsRequestIdRef.current) {
        setBookingsLoading(false);
      }
    }
  }, []);

  const refreshDashboard = useCallback(() => {
    fetchDashboardStats();
    fetchRecentBookings();
  }, [fetchDashboardStats, fetchRecentBookings]);

  useEffect(() => {
    mountedRef.current = true;

    fetchDashboardStats();
    fetchRecentBookings();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      bookingsRequestIdRef.current += 1;
    };
  }, [fetchDashboardStats, fetchRecentBookings]);

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
          <Card className="p-8 text-center" padding="none">
            <div role="status">
              <p className="font-medium text-slate-800">Loading dashboard...</p>
              <p className="mt-2 text-sm text-slate-500">
                Please wait while we load your business statistics.
              </p>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
          description="Manage your services, appointments, and customers from one place."
        >
          <Button
            variant="secondary"
            onClick={refreshDashboard}
            disabled={isRefreshing || isLoading || bookingsLoading}
          >
            {isRefreshing || isLoading || bookingsLoading
              ? "Refreshing..."
              : "Refresh dashboard"}
          </Button>
        </PageHeader>

        <p className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          BookFlow
        </p>

        {error && (
          <Card className="mb-6 border-red-100 bg-red-50">
            <div role="alert">
              <h2 className="font-semibold text-red-800">
                {stats ? "Dashboard refresh failed" : "Dashboard unavailable"}
              </h2>

              <p className="mt-2 text-sm text-red-700">{error}</p>

              <Button
                className="mt-4"
                onClick={fetchDashboardStats}
                disabled={isRefreshing || isLoading}
              >
                Try again
              </Button>

              {stats && (
                <p className="mt-3 text-sm text-red-700">
                  Your previously loaded statistics are still displayed.
                </p>
              )}
            </div>
          </Card>
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
                  <Card key={stat.label}>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {formatNumber(stat.value)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {stat.description}
                    </p>
                  </Card>
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
                  {STATUS_CONFIG.map((item) => (
                    <Card key={item.key}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-600">
                          {item.label}
                        </p>
                        <StatusBadge status={item.label.toLowerCase()} />
                      </div>

                      <p className="mt-4 text-3xl font-bold text-slate-900">
                        {formatNumber(stats[item.key])}
                      </p>
                    </Card>
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
                    <Card>
                      <p className="text-sm font-medium text-slate-500">
                        Completed booking revenue
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {formatCurrency(stats.totalRevenue, stats.currency)}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Based on the revenue value returned by your API.
                      </p>
                    </Card>
                  )}

                  {hasStatusStats && (
                    <Card>
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
                    </Card>
                  )}
                </div>
              </section>
            )}

            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recent bookings
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Your five most recent appointments.
                  </p>
                </div>

                <Link
                  to="/owner/bookings"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  View all bookings →
                </Link>
              </div>

              <Card padding="none" className="overflow-hidden">
                {bookingsLoading ? (
                  <div role="status" className="p-8 text-center">
                    <p className="font-medium text-slate-800">
                      Loading recent bookings...
                    </p>
                  </div>
                ) : bookingsError ? (
                  <div className="p-6" role="alert">
                    <p className="font-semibold text-red-800">
                      Could not load recent bookings
                    </p>
                    <p className="mt-2 text-sm text-red-700">{bookingsError}</p>
                    <Button className="mt-4" onClick={fetchRecentBookings}>
                      Try again
                    </Button>
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="p-8 text-center">
                    <h3 className="font-semibold text-slate-900">
                      No bookings yet
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      New customer appointments will appear here.
                    </p>
                    <Link
                      to="/owner/services"
                      className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Manage your services →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-slate-100 md:hidden">
                      {recentBookings.map((booking) => (
                        <article key={booking._id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-slate-900">
                                {booking.customer?.name || "Customer"}
                              </h3>
                              <p className="mt-1 truncate text-sm text-slate-600">
                                {booking.service?.name || "Service unavailable"}
                              </p>
                            </div>

                            <StatusBadge status={booking.status} />
                          </div>

                          <p className="mt-3 text-sm text-slate-600">
                            {formatBookingDate(booking.date)} ·{" "}
                            {formatBookingTime(booking.startTime)}
                          </p>

                          <Link
                            to={`/bookings/${booking._id}`}
                            className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
                          >
                            View booking →
                          </Link>
                        </article>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full divide-y divide-slate-200 text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Service
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Date &amp; time
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Status
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {recentBookings.map((booking) => (
                            <tr key={booking._id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-6 py-4">
                                <p className="font-semibold text-slate-900">
                                  {booking.customer?.name || "Customer"}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {booking.customer?.email || ""}
                                </p>
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-700">
                                {booking.service?.name || "Service unavailable"}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                                <p>{formatBookingDate(booking.date)}</p>
                                <p className="mt-1 text-slate-500">
                                  {formatBookingTime(booking.startTime)}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <StatusBadge status={booking.status} />
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <Link
                                  to={`/bookings/${booking._id}`}
                                  className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                                >
                                  View details →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">
                Manage your business
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  to="/owner/services"
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                    <h3 className="text-lg font-bold text-slate-900">
                      Services
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Create, update, and manage the services your business
                      offers.
                    </p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                      Manage services →
                    </span>
                  </Card>
                </Link>

                <Link
                  to="/owner/bookings"
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                    <h3 className="text-lg font-bold text-slate-900">
                      Bookings
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Search appointments, manage statuses, and review bookings.
                    </p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                      Manage bookings →
                    </span>
                  </Card>
                </Link>

                <Link
                  to="/owner/customers"
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                    <h3 className="text-lg font-bold text-slate-900">
                      Customers
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      View customers who have booked your services.
                    </p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                      View customers →
                    </span>
                  </Card>
                </Link>

                <Link
                  to="/owner/availability"
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                    <h3 className="text-lg font-bold text-slate-900">
                      Availability
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Set the days and hours when customers can book
                      appointments.
                    </p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-900">
                      Manage availability →
                    </span>
                  </Card>
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
