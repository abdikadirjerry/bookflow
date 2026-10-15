import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OWNER_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: "▦" },
  { label: "Services", path: "/owner/services", icon: "◇" },
  { label: "Bookings", path: "/owner/bookings", icon: "▣" },
  { label: "Customers", path: "/owner/customers", icon: "♙" },
  { label: "Availability", path: "/owner/availability", icon: "◷" },
  { label: "Notifications", path: "/notifications", icon: "♧" },
];

function OwnerSidebar({ onNavigate }) {
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-6">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="text-xl font-extrabold tracking-tight text-slate-900"
        >
          Book<span className="text-blue-600">Flow</span>
        </Link>

        <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-500">
          Business workspace
        </p>
      </div>

      <nav aria-label="Owner navigation" className="flex-1 px-4 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {OWNER_LINKS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center text-lg"
              >
                {item.icon}
              </span>

              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold text-slate-800">
            {user?.name || "Business owner"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Owner account</p>
        </div>

        <Link
          to="/services"
          onClick={onNavigate}
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <span aria-hidden="true">↗</span>
          View customer site
        </Link>
      </div>
    </div>
  );
}

function OwnerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.key]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
      menuButtonRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
          <OwnerSidebar />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 lg:ml-64">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              aria-label="Open owner navigation"
              aria-expanded={mobileMenuOpen}
              aria-controls="owner-mobile-navigation"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ☰
            </button>

            <Link
              to="/dashboard"
              className="text-lg font-extrabold tracking-tight text-slate-900"
            >
              Book<span className="text-blue-600">Flow</span>
            </Link>

            <span className="ml-auto text-xs font-medium text-slate-500">
              Owner workspace
            </span>
          </header>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close owner navigation"
            onClick={closeMenu}
            className="absolute inset-0 h-full w-full bg-slate-950/40"
          />

          <aside
            id="owner-mobile-navigation"
            aria-label="Mobile owner navigation drawer"
            aria-modal="true"
            role="dialog"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-sm font-semibold text-slate-700">
                Navigation
              </span>

              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenu}
                className="rounded-lg px-3 py-1 text-2xl text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ×
              </button>
            </div>

            <div className="flex-1">
              <OwnerSidebar onNavigate={closeMenu} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default OwnerLayout;
