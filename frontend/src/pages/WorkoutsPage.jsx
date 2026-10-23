import React, { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Dumbbell, ChevronRight, History, Play } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { workoutName } from '../utils/labels';

const weekStartOf = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

/** Upcoming + in-progress workouts. Finished ones live in the Profile page history. */
const WorkoutsPage = () => {
  const { workouts, fetchWorkouts, loading } = useWorkout();
  const navigate = useNavigate();

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const { active, groups, completedCount } = useMemo(() => {
    const open = workouts.filter((w) => w.status === 'scheduled' || w.status === 'active');
    const grouped = new Map();
    open
      .filter((w) => w.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .forEach((w) => {
        const key = weekStartOf(w.scheduled_date).getTime();
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(w);
      });
    return {
      active: open.find((w) => w.status === 'active'),
      groups: [...grouped.entries()],
      completedCount: workouts.filter((w) => w.status === 'completed').length,
    };
  }, [workouts]);

  const Row = ({ w }) => (
    <button type="button" onClick={() => navigate(`/workout/${w.id}`)} className="group w-full text-left">
      <Card className="flex items-center justify-between gap-4 !p-4 transition-colors hover:border-indigo-500/40">
        <div className="flex min-w-0 items-center gap-4">
          <div className="rounded-xl bg-slate-800 p-3 text-indigo-400"><Dumbbell className="h-5 w-5" /></div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-100">{workoutName(w)}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(w.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              <span className="text-slate-600">·</span>{w.total_sets} sets
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {w.status === 'active' ? <Badge variant="success">In progress</Badge> : <Badge variant="default">Scheduled</Badge>}
          <ChevronRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-slate-300" />
        </div>
      </Card>
    </button>
  );

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-slate-100">Workouts</h1>
          <p className="text-slate-400">Your scheduled sessions</p>
        </div>
        <Link to="/profile#history" className="btn-ghost flex items-center gap-2 text-sm">
          <History className="h-4 w-4" /> Completed workouts ({completedCount})
        </Link>
      </header>

      {active && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400"><Play className="h-4 w-4" /> In progress</h2>
          <Row w={active} />
        </section>
      )}

      {groups.length === 0 && !active && !loading && (
        <Card className="py-14 text-center">
          <p className="text-slate-300">Nothing scheduled right now.</p>
          <p className="mt-1 text-sm text-slate-500">Create a routine in <Link to="/templates" className="text-indigo-400 hover:underline">Templates</Link> to add a session.</p>
        </Card>
      )}

      <div className="space-y-8">
        {groups.map(([weekStart, list]) => (
          <section key={weekStart}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h2>
            <div className="space-y-3">{list.map((w) => <Row key={w.id} w={w} />)}</div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default WorkoutsPage;
