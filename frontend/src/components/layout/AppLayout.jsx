import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, User, LogOut, LayoutTemplate, Sun, Moon } from 'lucide-react';
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
  const [theme, setTheme] = useState(() => localStorage.getItem('smartlift-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smartlift-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <aside className="fixed z-10 hidden h-full w-64 flex-col border-r border-border bg-surface md:flex">
        <div className="p-6">
          <div className="mb-8 flex items-center gap-3 text-accent">
            <Dumbbell className="h-7 w-7" />
            <span className="font-display text-xl font-medium tracking-tight text-text">SmartLift</span>
          </div>
          <nav className="space-y-1.5" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors border ${
                    isActive
                      ? 'bg-raised border-border text-accent'
                      : 'border-transparent text-text-muted hover:bg-raised/60 hover:text-text'
                  }`
                }
              >
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-raised text-sm font-medium text-accent">
              {(user?.first_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{user?.first_name || 'Athlete'}</div>
              <div className="truncate text-xs text-text-muted">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Warm Porcelain (Light)' : 'Switch to Midnight Slate (Dark)'}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-raised hover:text-text"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-accent" />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-4 w-4" /> <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="p-6 pb-28 md:ml-64 md:pb-10 lg:p-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur md:hidden" aria-label="Main mobile">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-text-muted'}`
            }
          >
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
