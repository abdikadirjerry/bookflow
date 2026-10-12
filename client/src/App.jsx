import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

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

function CustomerLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
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
          {/* Customer layout */}
          <Route element={<CustomerLayout />}>
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceId" element={<ServiceDetails />} />
            <Route path="/services/:serviceId/book" element={<Booking />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/bookings/:bookingId" element={<BookingDetails />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Owner layout — no regular Navbar */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
