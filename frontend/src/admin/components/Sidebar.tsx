import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-4 py-4 text-xs font-semibold tracking-wide text-slate-400">
        BC APPAREL
      </div>

      <nav className="flex-1 px-2 space-y-1 text-sm">
        <NavLink
          to="/admin/designs"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md ${
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-200 hover:bg-slate-800/60'
            }`
          }
        >
          Print Jobs
        </NavLink>

        <NavLink
          to="/admin/designs/completed"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md ${
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-200 hover:bg-slate-800/60'
            }`
          }
        >
          Completed
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
