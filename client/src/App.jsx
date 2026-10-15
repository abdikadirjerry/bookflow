import { BrowserRouter, Routes, Route, Outlet, Link } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import Booking from "./pages/Booking";
import BookingSuccess from "./pages/BookingSuccess";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import Dashboard from "./pages/Dashboard";
import OwnerServices from "./pages/OwnerServices";
import CreateService from "./pages/CreateService";
import EditService from "./pages/EditService";
import OwnerBookings from "./pages/OwnerBookings";
import OwnerCustomers from "./pages/OwnerCustomers";
import OwnerAvailability from "./pages/OwnerAvailability";
import Notifications from "./pages/Notifications";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import Navbar from "./components/Navbar";
import OwnerLayout from "./components/OwnerLayout";
import { useAuth } from "./context/AuthContext";

function CustomerLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function NotificationsLayout() {
  const { user } = useAuth();

  return user?.role === "business_owner" ? <OwnerLayout /> : <CustomerLayout />;
}

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Error 404
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-slate-600">
          The page you are looking for doesn't exist or may have moved.
        </p>

        <Link
          to="/services"
          className="mt-6 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Go to services
        </Link>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute />}>
          {/* Customer routes */}
          <Route element={<CustomerLayout />}>
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceId" element={<ServiceDetails />} />
            <Route path="/services/:serviceId/book" element={<Booking />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/bookings/:bookingId" element={<BookingDetails />} />
          </Route>

          {/* Notifications use the layout appropriate to the signed-in role */}
          <Route path="/notifications" element={<NotificationsLayout />}>
            <Route index element={<Notifications />} />
          </Route>

          {/* Business-owner-only routes */}
          <Route element={<RoleRoute allowedRoles={["business_owner"]} />}>
            <Route element={<OwnerLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/owner/services" element={<OwnerServices />} />
              <Route path="/owner/services/new" element={<CreateService />} />
              <Route
                path="/owner/services/:serviceId/edit"
                element={<EditService />}
              />
              <Route path="/owner/bookings" element={<OwnerBookings />} />
              <Route path="/owner/customers" element={<OwnerCustomers />} />
              <Route
                path="/owner/availability"
                element={<OwnerAvailability />}
              />
            </Route>
          </Route>
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
