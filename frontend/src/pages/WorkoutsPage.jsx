import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Home, User, LogOut, Calendar, Clock, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const statusVariant = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'active': return 'info';
    case 'skipped': return 'warning';
    default: return 'default';
  }
};

const splitLabel = (type) => {
  const map = { PPL_PUSH: 'Push 💪', PPL_PULL: 'Pull 🔙', PPL_LEGS: 'Legs 🦵', UPPER: 'Upper Body', LOWER: 'Lower Body', FULL_BODY: 'Full Body' };
  return map[type] || type;
};

const WorkoutsPage = () => {
  const { user, logout } = useAuth();
  const { workouts, fetchWorkouts } = useWorkout();
  const navigate = useNavigate();

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const grouped = workouts.reduce((acc, w) => {
    const week = `Week of ${new Date(w.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    (acc[week] = acc[week] || []).push(w);
    return acc;
  }, {});

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
            <Link to="/workouts" className="flex items-center gap-3 px-4 py-3 bg-electric-indigo/10 text-indigo-400 rounded-xl font-medium transition-colors">
              <Dumbbell className="w-5 h-5" /> Workouts
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl font-medium transition-colors">
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
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Workouts</h1>
          <p className="text-slate-400">Your full 4-week training schedule</p>
        </header>

        {!workouts || workouts.length === 0 ? (
          <Card className="text-center py-16">
            <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No workouts scheduled yet.</p>
            <p className="text-slate-500 text-sm mt-1">Complete onboarding to generate your program.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([week, weekWorkouts]) => (
              <div key={week}>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {week}
                </h2>
                <div className="grid gap-3">
                  {weekWorkouts.sort((a,b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)).map(workout => (
                    <button
                      key={workout.id}
                      onClick={() => navigate(`/workout/${workout.id}`)}
                      className="glass-card p-4 flex items-center justify-between hover:border-indigo-500/40 transition-all group text-left w-full"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${workout.status === 'completed' ? 'bg-green-500/10' : 'bg-indigo-500/10'}`}>
                          {workout.status === 'completed'
                            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                            : <Circle className="w-5 h-5 text-indigo-400" />
                          }
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{splitLabel(workout.split_type)}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(workout.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusVariant(workout.status)}>
                          {workout.status.charAt(0).toUpperCase() + workout.status.slice(1)}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutsPage;
