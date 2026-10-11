import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/notificationService";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  const isOwner = user?.role === "business_owner";

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }

    let active = true;

    const loadUnreadCount = async () => {
      try {
        const data = await getNotifications();

        if (active) {
          setUnreadCount(
            Number.isFinite(Number(data.unreadCount))
              ? Math.max(0, Number(data.unreadCount))
              : 0,
          );
        }
      } catch (error) {
        // Keep navigation usable if notifications cannot be loaded.
        console.error("Unable to load unread notifications:", error);
      }
    };

    const refreshNotifications = () => {
      loadUnreadCount();
    };

    loadUnreadCount();

    window.addEventListener("focus", refreshNotifications);
    window.addEventListener(
      "bookflow:notifications-updated",
      refreshNotifications,
    );

    return () => {
      active = false;
      window.removeEventListener("focus", refreshNotifications);
      window.removeEventListener(
        "bookflow:notifications-updated",
        refreshNotifications,
      );
    };
  }, [isAuthenticated, location.pathname]);

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) {
    return null;
  }

  const bookingPath = isOwner ? "/owner/bookings" : "/bookings";
  const bookingLabel = isOwner ? "Bookings" : "My Bookings";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          to={isOwner ? "/dashboard" : "/services"}
          className="text-xl font-extrabold tracking-tight text-blue-700"
        >
          BookFlow
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {isOwner ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/owner/services" className={linkClass}>
                Services
              </NavLink>

              <NavLink to="/owner/customers" className={linkClass}>
                Customers
              </NavLink>

              <NavLink to="/owner/availability" className={linkClass}>
                Availability
              </NavLink>
            </>
          ) : (
            <NavLink to="/services" className={linkClass}>
              Services
            </NavLink>
          )}

          <NavLink to={bookingPath} className={linkClass}>
            <span className="inline-flex items-center gap-2">
              {bookingLabel}

              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} unread notifications`}
                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold leading-4 text-white"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
