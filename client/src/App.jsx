import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Dashboard from "./pages/Dashboard";
import OwnerServices from "./pages/OwnerServices";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/services" element={<Services />} />

          <Route path="/services/:serviceId" element={<ServiceDetails />} />

          <Route path="/services/:serviceId/book" element={<Booking />} />

          <Route path="/bookings" element={<MyBookings />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["business_owner"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/owner/services" element={<OwnerServices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
