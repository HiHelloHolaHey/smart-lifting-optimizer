import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Re-fetches the full profile from the server. Returns the user or null. */
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await auth.getMe();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (credentials) => {
    const { data } = await auth.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const { data } = await auth.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await auth.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (changes) => {
    const { data } = await auth.updateProfile(changes);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
