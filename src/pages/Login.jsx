import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, authError: contextError } = useAuth();

  const [credentials, setCredentials] = useState({
    username: 'shms@admin',
    password: 'bandhav',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      const targetPath = location.state?.from?.pathname || '/';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(credentials.username, credentials.password);
      const targetPath = location.state?.from?.pathname || '/';
      navigate(targetPath, { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#000000] relative flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden font-sans">
      {/* Ambient background red glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-red-600/[0.04] rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Top Branding Header with red logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#000000] border border-red-500/30 shadow-xl shadow-red-950/30 mb-4 p-3 relative group transition-transform duration-200 hover:scale-105">
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-sm pointer-events-none" />
            <img
              src="/logo-icon.png"
              alt="Server Health Monitoring Logo"
              className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_2px_12px_rgba(239,68,68,0.5)]"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Server Health Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 font-medium">
            SHMS v3.1 Production Control Room
          </p>
        </div>

        {/* Login Form Card - Pure Black and Red Theme */}
        <div className="bg-[#000000] border border-neutral-800/90 rounded-2xl shadow-2xl shadow-black p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle top red gradient accent line */}
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-neutral-800">
            <LogIn className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-white">Sign In to Dashboard</h2>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/25 transition-all"
                  placeholder="shms@admin"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/25 transition-all"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick info credentials */}
          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>Production Mode</span>
            <span className="text-neutral-400 text-[11px]">JWT Bearer Active</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
