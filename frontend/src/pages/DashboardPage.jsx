import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Dumbbell, User, LogOut, Activity, BarChart3, Clock, ChevronRight, LayoutTemplate, CalendarPlus } from 'lucide-react';
import { analytics } from '../api/endpoints';
import MuscleBodyMap from '../components/dashboard/MuscleBodyMap';
import MonthlyVolumeChart from '../components/dashboard/MonthlyVolumeChart';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { useCountdown } from '../hooks/useCountdown';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockVolumeData = [
  { week: 'W1', volume: 12000 },
  { week: 'W2', volume: 13500 },
  { week: 'W3', volume: 13200 },
  { week: 'W4', volume: 14800 },
  { week: 'W5', volume: 15500 },
  { week: 'W6', volume: 15200 },
  { week: 'W7', volume: 16800 },
  { week: 'W8', volume: 18000 },
];

const mockHeatmapData = [
  { day: 'Mon', level: 1 },
  { day: 'Tue', level: 3 },
  { day: 'Wed', level: 0 },
  { day: 'Thu', level: 2 },
  { day: 'Fri', level: 4 },
  { day: 'Sat', level: 0 },
  { day: 'Sun', level: 1 },
];

const NextSessionTimer = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);
  
  if (!targetDate) return null;
  if (isPast) return <div className="text-xl font-bold text-white">Ready now</div>;

  return (
    <div className="flex gap-4 text-white">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{days}</span>
        <span className="text-xs text-indigo-200">Days</span>
      </div>
      <span className="text-2xl font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{hours.toString().padStart(2, '0')}</span>
        <span className="text-xs text-indigo-200">Hrs</span>
      </div>
      <span className="text-2xl font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs text-indigo-200">Min</span>
      </div>
      <span className="text-2xl font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs text-indigo-200">Sec</span>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { workouts, fetchWorkouts } = useWorkout();
  const navigate = useNavigate();
  const [nextWorkout, setNextWorkout] = useState(null);
  const [recovery, setRecovery] = useState([]);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    analytics.recovery().then(({ data }) => setRecovery(data)).catch(() => {});
    analytics.volume().then(({ data }) => setMonthly(data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    if (workouts && workouts.length > 0) {
      const pending = workouts.filter(w => w.status === 'scheduled' || w.status === 'in_progress');
      if (pending.length > 0) {
        pending.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
        setNextWorkout(pending[0]);
      } else {
        setNextWorkout(null);
      }
    }
  }, [workouts]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getHeatmapColor = (level) => {
    switch(level) {
      case 0: return 'bg-slate-800';
      case 1: return 'bg-indigo-900';
      case 2: return 'bg-indigo-700';
      case 3: return 'bg-indigo-500';
      case 4: return 'bg-electric-indigo';
      default: return 'bg-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 text-electric-indigo mb-8">
            <Dumbbell className="w-8 h-8" />
            <span className="text-xl font-bold text-slate-100 tracking-tight">SmartLift</span>
          </div>
          
          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-electric-indigo/10 text-indigo-400 rounded-xl font-medium transition-colors">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/workouts" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl font-medium transition-colors">
              <Dumbbell className="w-5 h-5" />
              Workouts
            </Link>
            <Link to="/templates" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl font-medium transition-colors">
              <LayoutTemplate className="w-5 h-5" />
              Templates
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl font-medium transition-colors">
              <User className="w-5 h-5" />
              Profile
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
              <div className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-6 lg:p-10">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Command Center</h1>
            <p className="text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <a href="/api/schedule/export" download className="btn-ghost flex items-center gap-2 text-sm">
            <CalendarPlus className="w-4 h-4" /> Sync to Calendar
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Next Session Card */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-electric-indigo/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <Badge variant="info" className="mb-3">Next Session</Badge>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                  {nextWorkout ? `${nextWorkout.split_type} Day` : 'No upcoming workouts'}
                </h2>
                <p className="text-slate-400 mb-6">
                  {nextWorkout ? new Date(nextWorkout.scheduled_date).toLocaleDateString() : 'Generate a new schedule to continue.'}
                </p>
                <NextSessionTimer targetDate={nextWorkout?.scheduled_date} />
              </div>
              
              {nextWorkout && (
                <Button 
                  onClick={() => navigate(`/workout/${nextWorkout.id || nextWorkout._id || 1}`)} 
                  className="w-full md:w-auto shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                >
                  Start Workout <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              )}
            </div>
          </Card>

          {/* Weekly Stats */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Weekly Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-3 text-slate-400">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <span>Workouts</span>
                </div>
                <span className="font-bold text-slate-200">4 / 5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-3 text-slate-400">
                  <Dumbbell className="w-5 h-5 text-green-400" />
                  <span>Sets Completed</span>
                </div>
                <span className="font-bold text-slate-200">72</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-3 text-slate-400">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span>Volume (kg)</span>
                </div>
                <span className="font-bold text-slate-200">18,000</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Card */}
          <Card className="lg:col-span-2 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-100 mb-6">Volume Progress</h3>
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="week" stroke="#64748B" tick={{fill: '#64748B', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" tick={{fill: '#64748B', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '0.5rem', color: '#F1F5F9' }}
                    itemStyle={{ color: '#818CF8' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Heatmap Card */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-100 mb-6">Weekly Heatmap</h3>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {mockHeatmapData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-md ${getHeatmapColor(d.level)} transition-colors duration-300 hover:ring-2 hover:ring-indigo-400 ring-offset-2 ring-offset-slate-900 cursor-pointer`} title={`${d.day} Volume Level: ${d.level}`} />
                  <span className="text-xs text-slate-500">{d.day}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-800 text-xs text-slate-400">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div key={level} className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`} />
                ))}
              </div>
              <span>More</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Monthly Volume</h3>
            <MonthlyVolumeChart data={monthly} />
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Muscle Recovery</h3>
            <MuscleBodyMap recovery={recovery} />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
