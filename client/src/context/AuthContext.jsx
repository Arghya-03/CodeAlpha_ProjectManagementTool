
import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import {
  connectSocket,
  disconnectSocket
} from "../services/socketService";

const AuthContext = createContext(null);

const API_URL = "http://localhost:5000/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("projectflow_token")
  );
  const [loading, setLoading] = useState(true);

  // Restore logged-in session
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Session expired");
        }

        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("projectflow_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [token]);

  // Manage Socket.IO connection
  useEffect(() => {
    if (token && user) {
      connectSocket(token);
    }

    return () => {
      disconnectSocket();
    };
  }, [token, user?._id]);

  // Register
  const register = async (name, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  };

  // Login
  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("projectflow_token", data.token);
    setToken(data.token);
    setUser(data.user);

    connectSocket(data.token);

    return data;
  };

  // Update user information globally
  const updateUser = (updatedUser) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...updatedUser
    }));
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("projectflow_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
