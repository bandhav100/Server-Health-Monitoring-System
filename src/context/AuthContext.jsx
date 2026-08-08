import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as loginApiService, logoutUser as logoutApiService } from '../services/authService';

const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('shms_token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('shms_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAuthenticated = Boolean(token);

  const login = async (credentials) => {
    try {
      const response = await loginApiService(credentials);
      const authToken = response?.token || response?.accessToken || response?.jwt || 'token_placeholder';
      const userData = response?.user || { username: credentials.emailOrUsername || credentials.username };

      localStorage.setItem('shms_token', authToken);
      localStorage.setItem('shms_user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('shms_token');
    localStorage.removeItem('shms_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
