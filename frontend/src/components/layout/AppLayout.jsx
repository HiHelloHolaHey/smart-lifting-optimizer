import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, User, LogOut, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/profile', label: 'Profile', icon: User },
];

/** One persistent shell (sidebar on desktop, bottom bar on mobile) shared by every main page. */
const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <aside className="fixed z-10 hidden h-full w-64 flex-col border-r border-slate-800 bg-slate-900/50 md:flex">
        <div className="p-6">
          <div className="mb-8 flex items-center gap-3 text-electric-indigo">
            <Dumbbell className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-slate-100">SmartLift</span>
          </div>
          <nav className="space-y-2" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors ${
                    isActive ? 'bg-electric-indigo/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" /> {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-800 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 font-bold text-indigo-400">
              {(user?.first_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-200">{user?.first_name || 'Athlete'}</div>
              <div className="truncate text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-2 py-2 text-slate-400 transition-colors hover:text-red-400">
            <LogOut className="h-5 w-5" /> <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      <main className="p-6 pb-28 md:ml-64 md:pb-10 lg:p-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden" aria-label="Main mobile">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
