import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RoleRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    if (user?.role === "customer") {
      return <Navigate to="/services" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
