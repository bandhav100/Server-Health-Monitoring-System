import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import ChartCard from '../components/UI/ChartCard';
import api, { unwrap } from '../api';

const Profile = () => {
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((response) => setProfile(unwrap(response) || {})).catch(() => {});
  }, []);

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post('/auth/change-password', passwords);
      setPasswords({ current_password: '', new_password: '' });
      setMessage('Password updated successfully');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update password');
    }
  };

  return (
    <motion.div className="space-y-6 profile-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-heading border-b border-slate-200 dark:border-slate-800">
        <div className="icon-tile cyan">
          <User />
        </div>
        <div>
          <p className="eyebrow font-semibold">Operator identity</p>
          <h1 className="font-bold text-2xl">Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Account access and security details</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Account" subtitle="Authenticated SHMS operator">
          <div className="flex items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-cyan-400/15 text-cyan-500 flex items-center justify-center">
              <User />
            </div>
            <div>
              <p className="text-lg font-semibold">{profile.full_name || profile.username || 'Operator'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{profile.username || 'Unknown username'}</p>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> Active administrator account
          </div>
        </ChartCard>
        <ChartCard title="Change password" subtitle="Keep your control-room access secure">
          <form onSubmit={changePassword} className="space-y-4">
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{message}</p>}
            {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}
            <label className="field-label font-medium text-sm">
              Current password
              <input
                required
                type="password"
                className="input-field w-full mt-2"
                value={passwords.current_password}
                onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })}
              />
            </label>
            <label className="field-label font-medium text-sm">
              New password
              <input
                required
                minLength="6"
                type="password"
                className="input-field w-full mt-2"
                value={passwords.new_password}
                onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })}
              />
            </label>
            <button className="btn-primary inline-flex items-center gap-2 font-semibold">
              <KeyRound className="w-4 h-4" /> Update password
            </button>
          </form>
        </ChartCard>
      </div>
    </motion.div>
  );
};

export default Profile;