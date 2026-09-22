import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axiosClient, { unwrap } from '../axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('shms_token') || localStorage.getItem('token') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem('shms_user') || localStorage.getItem('user');
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Auto-login / session verification on page mount or refresh
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const currentToken = localStorage.getItem('shms_token') || localStorage.getItem('token');
      if (!currentToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // Hydrate and verify user session against backend
        const response = await axiosClient.get('/auth/me');
        const userData = unwrap(response);
        if (isMounted) {
          setUser(userData);
          setToken(currentToken);
          localStorage.setItem('shms_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid token:', err.message);
        if (err.response?.status === 401 || err.response?.status === 422) {
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('shms_token');
            localStorage.removeItem('shms_user');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();

    // Listen to global 401 unauthorized events emitted by axiosClient
    const handleUnauthorized = () => {
      if (isMounted) {
        setToken(null);
        setUser(null);
        setAuthError('Session expired. Please log in again.');
      }
    };

    window.addEventListener('shms:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('shms:unauthorized', handleUnauthorized);
    };
  }, []);

  // Login handler
  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const response = await axiosClient.post('/auth/login', { username, password });
      const payload = unwrap(response);
      const jwtToken = payload?.token;
      const userProfile = payload?.user || { username };

      if (!jwtToken) {
        throw new Error('Authentication succeeded but no JWT was received.');
      }

      // Persist token and user in localStorage with primary key shms_token
      localStorage.setItem('shms_token', jwtToken);
      localStorage.setItem('shms_user', JSON.stringify(userProfile));

      // Also set legacy keys for backwards-compatibility
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userProfile));

      setToken(jwtToken);
      setUser(userProfile);

      return { success: true, user: userProfile, token: jwtToken };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Best-effort logout on backend
    } finally {
      localStorage.removeItem('shms_token');
      localStorage.removeItem('shms_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setAuthError(null);
      window.location.href = '/login';
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    loading,
    authError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
