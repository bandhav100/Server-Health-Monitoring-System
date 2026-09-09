import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import api, { unwrap } from '../api';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: 'shms@admin', password: 'bandhav' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = unwrap(await api.post('/auth/login', credentials));
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      window.location.href = '/';
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8 space-y-5">
        <div className="flex items-center gap-3">
          <LogIn className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">SHMS Login</h1>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <label className="block text-sm text-gray-300">Username<input className="input-field w-full mt-2" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label>
        <label className="block text-sm text-gray-300">Password<input type="password" className="input-field w-full mt-2" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label>
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
};

export default Login;
