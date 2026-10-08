import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerDashboardStats } from "../services/userService";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getOwnerDashboardStats();

        setStats(data.stats);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load dashboard statistics. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
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
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
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

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
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
          </div>
        )}

        {!isLoading && !error && stats && (
          <>
            <section
              aria-label="Dashboard statistics"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {statCards.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {stat.description}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-8">
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
                    View appointments and update their status.
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
