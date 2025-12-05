// src/admin/components/Topbar.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/admin/designs')) return 'Print Jobs';
  if (pathname.startsWith('/admin/completed')) return 'Completed Jobs';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  return 'Dashboard';
};

const Topbar: React.FC = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem('admin_authed');
    window.location.href = '/admin'; // or window.location.reload()
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      {/* Left side: title + subtitle */}
      <div>
        <h1 className="text-base font-semibold text-slate-900">
          {title}
        </h1>
        <p className="text-xs text-slate-500">
          Internal tools for production staff
        </p>
      </div>

      {/* Right side: tags + logout */}
      <div className="flex items-center gap-3 text-xs">
        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Environment: <span className="font-semibold">Dev</span>
        </span>

        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Phase 2
        </span>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-[11px] 
                     font-semibold hover:bg-slate-700 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
