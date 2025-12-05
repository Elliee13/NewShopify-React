import React, { useState } from 'react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD ?? 'printcrew2025';

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (value === ADMIN_PASSWORD) {
      localStorage.setItem('admin_authed', '1');
      setError('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Admin Login</h2>
          <p className="text-sm text-slate-500 mt-1">
            Authorized access only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder="Enter admin password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          {error && (
            <div className="text-rose-600 text-xs font-medium">{error}</div>
          )}

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold
                       hover:bg-brand-cta transition-colors shadow-md"
          >
            Login
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 mt-6">
          Internal use only — Custom Print Admin
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
