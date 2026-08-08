import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback if accessed outside AuthProvider context
    const hasToken = Boolean(localStorage.getItem('shms_token'));
    return { isAuthenticated: hasToken, user: null, login: () => {}, logout: () => {} };
  }
  return context;
}
