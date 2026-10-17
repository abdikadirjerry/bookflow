import { createContext, useContext, useState } from "react";
import {
  loginUser as loginUserRequest,
  registerUser as registerUserRequest,
} from "../services/authService";

const AuthContext = createContext(null);

const getStoredSession = () => {
  try {
    const token = localStorage.getItem("bookflow_token");
    const storedUser = localStorage.getItem("bookflow_user");

    if (!token || !storedUser) {
      localStorage.removeItem("bookflow_token");
      localStorage.removeItem("bookflow_user");
      return { token: null, user: null };
    }

    const user = JSON.parse(storedUser);

    if (!user || typeof user !== "object" || Array.isArray(user)) {
      throw new Error("Invalid stored user");
    }

    return { token, user };
  } catch {
    localStorage.removeItem("bookflow_token");
    localStorage.removeItem("bookflow_user");

    return { token: null, user: null };
  }
};

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(getStoredSession);

  const login = async (email, password) => {
    const data = await loginUserRequest(email, password);

    if (
      !data?.token ||
      typeof data.token !== "string" ||
      !data?.user ||
      typeof data.user !== "object" ||
      Array.isArray(data.user)
    ) {
      throw new Error("The server returned an invalid login response.");
    }

    localStorage.setItem("bookflow_token", data.token);
    localStorage.setItem("bookflow_user", JSON.stringify(data.user));

    setSession({
      token: data.token,
      user: data.user,
    });

    return data;
  };

  const register = async (name, email, password) => {
    return registerUserRequest(name, email, password);
  };

  const logout = () => {
    localStorage.removeItem("bookflow_token");
    localStorage.removeItem("bookflow_user");

    setSession({ token: null, user: null });
  };

  const value = {
    user: session.user,
    token: session.token,
    login,
    register,
    logout,
    isAuthenticated: Boolean(session.token && session.user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export { AuthProvider, useAuth };
