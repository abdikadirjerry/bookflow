import { createContext, useContext, useState } from "react";
import {
  loginUser as loginUserRequest,
  registerUser as registerUserRequest,
} from "../services/authService";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    const data = await loginUserRequest(email, password);

    setUser(data.user);
    setToken(data.token);

    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUserRequest(name, email, password);

    return data;
  };

  const logout = () => {
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
