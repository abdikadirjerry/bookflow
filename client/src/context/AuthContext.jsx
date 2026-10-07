import { createContext, useContext, useState } from "react";
import {
  loginUser as loginUserRequest,
  registerUser as registerUserRequest,
} from "../services/authService";

const AuthContext = createContext(null);

const getStoredUser = () => {
  const storedUser = localStorage.getItem("bookflow_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("bookflow_user");
    return null;
  }
};

const getStoredToken = () => {
  return localStorage.getItem("bookflow_token");
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  const login = async (email, password) => {
    const data = await loginUserRequest(email, password);

    localStorage.setItem("bookflow_token", data.token);
    localStorage.setItem("bookflow_user", JSON.stringify(data.user));

    setUser(data.user);
    setToken(data.token);

    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUserRequest(name, email, password);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("bookflow_token");
    localStorage.removeItem("bookflow_user");

    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: Boolean(token),
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
