import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(() => localStorage.getItem("user_id") || "");

  const login = (username, jwtToken, user_id) => {
    setUsername(username);
    setToken(jwtToken);
    setUserId(user_id);
    localStorage.setItem("username", username);
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user_id", user_id);
  };

  const logout = () => {
    setUsername("");
    setToken("");
    setUserId("");
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
  };

  return (
    <AuthContext.Provider value={{ username, token, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
