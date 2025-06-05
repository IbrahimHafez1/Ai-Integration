import React, { createContext, useState, useEffect } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  getProfile as apiGetProfile,
} from '../services/authService';

// 1. Create a Context
export const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);

  useEffect(() => {
    if (token) {
      apiGetProfile(token)
        .then((profile) => {
          setUser(profile);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('jwtToken');
        });
    }
  }, [token]);

  const login = async (email, password) => {
    const { token: newToken } = await apiLogin(email, password);
    setToken(newToken);
    localStorage.setItem('jwtToken', newToken);
    const userData = await apiGetProfile(newToken);
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const { token: newToken } = await apiRegister(name, email, password);
    setToken(newToken);
    localStorage.setItem('jwtToken', newToken);
    const userData = await apiGetProfile(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwtToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
