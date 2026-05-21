import { createContext, useState, useEffect } from 'react';
import { getAuthUser, loginUser, logoutUser } from '../services/mockData';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from mock local storage on startup
    const loggedInUser = getAuthUser();
    if (loggedInUser) setUser(loggedInUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const loggedInUser = await loginUser(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
