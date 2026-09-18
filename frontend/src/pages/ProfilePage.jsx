import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Home, User, LogOut, Mail, Ruler, Weight, Target, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const goalLabel = (goal) => {
  const map = { strength: '💪 Strength', hypertrophy: '🏋️ Hypertrophy', weight_loss: '⚖️ Weight Loss', endurance: '🏃 Endurance' };
  return map[goal] || goal;
};

const expLabel = (level) => {
  const map = { beginner: '🌱 Beginner', intermediate: '⚡ Intermediate', advanced: '🔥 Advanced' };
  return map[level] || level;
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const stats = [
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'Height', value: user?.height_cm ? `${user.height_cm} cm` : '—', icon: Ruler },
    { label: 'Weight', value: user?.weight_kg ? `${user.weight_kg} kg` : '—', icon: Weight },
    { label: 'Goal', value: goalLabel(user?.goal), icon: Target },
    { label: 'Experience', value: expLabel(user?.experience_level), icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 text-electric-indigo mb-8">
            <Dumbbell className="w-8 h-8" />
            <span className="text-xl font-bold text-slate-100 tracking-tight">SmartLift</span>
          </div>
          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl font-medium transition-colors">
              <Home className="w-5 h-5" /> Dashboard
            </Link>
            <Link to="/workouts" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl font-medium transition-colors">
              <Dumbbell className="w-5 h-5" /> Workouts
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 bg-electric-indigo/10 text-indigo-400 rounded-xl font-medium transition-colors">
              <User className="w-5 h-5" /> Profile
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{user?.first_name || 'User'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2">
            <LogOut className="w-5 h-5" /><span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-0 md:ml-64 p-6 lg:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Profile</h1>
          <p className="text-slate-400">Your account details</p>
        </header>

        <div className="max-w-2xl space-y-6">
          {/* Avatar card */}
          <Card className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-3xl font-bold text-indigo-400">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">{user?.first_name || 'User'}</h2>
              <p className="text-slate-400 mt-1">{expLabel(user?.experience_level)}</p>
              <div className="mt-2">
                <Badge variant="info">{goalLabel(user?.goal)}</Badge>
              </div>
            </div>
          </Card>

          {/* Stats card */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Account Info</h3>
            <div className="divide-y divide-slate-800">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-200">{value || '—'}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Member since */}
          <Card className="text-center py-6">
            <p className="text-slate-500 text-sm">Member since</p>
            <p className="text-slate-300 font-semibold mt-1">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
