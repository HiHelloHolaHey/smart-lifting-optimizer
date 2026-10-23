import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Dumbbell, ChevronRight, CalendarPlus, Timer, Play, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { useCountdown } from '../hooks/useCountdown';
import { analytics, workouts as workoutsApi } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MuscleBodyMap from '../components/dashboard/MuscleBodyMap';
import MonthlyVolumeChart from '../components/dashboard/MonthlyVolumeChart';
import { workoutName, formatClock } from '../utils/labels';
import { findNextSet, useNow } from '../utils/workoutSets';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HEAT = ['bg-raised', 'bg-accent/25', 'bg-accent/50', 'bg-accent/75', 'bg-accent'];

const NextSessionTimer = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);
  if (!targetDate) return null;
  if (isPast) return <div className="text-lg font-medium text-text">Ready when you are</div>;
  const unit = (v, label, pad = true) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-medium tabular-nums text-text">{pad ? String(v).padStart(2, '0') : v}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
  return (
    <div className="flex gap-4 text-text" aria-label="Time until next session">
      {unit(days, 'Days', false)}<span className="text-2xl font-medium text-text-muted">:</span>
      {unit(hours, 'Hrs')}<span className="text-2xl font-medium text-text-muted">:</span>
      {unit(minutes, 'Min')}<span className="text-2xl font-medium text-text-muted">:</span>
      {unit(seconds, 'Sec')}
    </div>
  );
};

/** Replaces the "Next Session" card while a workout is running. */
const InProgressCard = ({ workout, onFinished }) => {
  const navigate = useNavigate();
  const now = useNow(1000);
  const [detail, setDetail] = useState(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => workoutsApi.getById(workout.id).then(({ data }) => alive && setDetail(data)).catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [workout.id]);

  let restLeft = 0;
  try {
    const rest = JSON.parse(localStorage.getItem(`workout-draft-${workout.id}`) || 'null')?.rest;
    if (rest?.endsAt) restLeft = Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
  } catch { /* ignore corrupt draft */ }

  const next = useMemo(() => (detail ? findNextSet(detail.sets) : null), [detail]);
  const doneSets = detail ? detail.sets.filter((s) => s.completed).length : 0;
  const totalSets = detail ? detail.sets.length : 0;
  const pct = totalSets > 0 ? Math.min(100, Math.round((doneSets / totalSets) * 100)) : 0;
  const elapsed = workout.started_at ? (now - new Date(workout.started_at).getTime()) / 1000 : 0;

  const finish = async () => {
    setBusy(true);
    try {
      await workoutsApi.finish(workout.id);
      localStorage.removeItem(`workout-draft-${workout.id}`);
      setConfirmFinish(false);
      onFinished();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="success" className="mb-3">Workout in progress</Badge>
            <h2 className="text-2xl font-medium text-text">{workoutName(workout)}</h2>
            <p className="mt-1 text-sm text-text-muted">{doneSets} of {totalSets || '–'} sets completed</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 font-mono text-2xl font-medium tabular-nums text-success" aria-label="Elapsed time">
              <Timer className="h-5 w-5" />{formatClock(elapsed)}
            </div>
            <div className="text-xs text-text-muted">elapsed</div>
          </div>
        </div>

        {/* Thin progress line per theme guide */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-raised">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-raised p-3">
            <div className="text-xs uppercase tracking-wide text-text-muted">Up next</div>
            <div className="mt-1 text-sm font-medium text-text">
              {!detail ? 'Loading…' : next ? `${next.exercise.exercise_name} · ${next.set.set_type === 'warmup' ? 'warm-up' : `set ${next.set.set_number}`}` : 'All sets done — finish when ready'}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-raised p-3">
            <div className="text-xs uppercase tracking-wide text-text-muted">Rest</div>
            <div className={`mt-1 flex items-center gap-1.5 font-mono text-sm font-medium ${restLeft > 0 ? 'text-warning' : 'text-text-muted'}`}>
              {restLeft > 0 && <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />}
              {restLeft > 0 ? `${formatClock(restLeft)} remaining` : 'Not resting'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate(`/workout/${workout.id}`)} className="flex-1">
            <Play className="mr-2 h-4 w-4" />Go to workout
          </Button>
          <Button variant="ghost" onClick={() => setConfirmFinish(true)} className="flex-1">
            <CheckCircle2 className="mr-2 h-4 w-4" />Finish workout
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish this workout?"
        message={`You've completed ${doneSets} of ${totalSets} sets. Finishing saves it to your history.`}
        actions={[
          { label: busy ? 'Finishing…' : 'Finish workout', variant: 'primary', onClick: finish, disabled: busy },
          { label: 'Keep training', variant: 'ghost', onClick: () => setConfirmFinish(false) },
        ]}
      />
    </Card>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { workouts, fetchWorkouts } = useWorkout();
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadAnalytics = () => {
    analytics.recovery().then(({ data }) => setRecovery(data)).catch(() => {});
    analytics.volume().then(({ data }) => setMonthly(data)).catch(() => {});
    analytics.summary().then(({ data }) => setSummary(data)).catch(() => {});
  };

  useEffect(() => { fetchWorkouts(); loadAnalytics(); }, [fetchWorkouts]);

  const active = workouts.find((w) => w.status === 'active');
  const nextWorkout = useMemo(
    () => workouts.filter((w) => w.status === 'scheduled').sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0] || null,
    [workouts]
  );

  const week = summary?.week || { planned: 0, completed: 0, sets: 0, volume: 0 };
  const weeklyVolume = summary?.weekly_volume || [];
  const hasVolume = weeklyVolume.some((w) => w.volume > 0);
  const heatmap = summary?.heatmap || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, level: 0, volume: 0 }));

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-medium text-text">{user?.first_name ? `Hey, ${user.first_name}` : 'Command Center'}</h1>
          <p className="text-text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <a href="/api/schedule/export" download className="btn-ghost flex items-center gap-2 text-sm">
          <CalendarPlus className="h-4 w-4 text-text-muted" /> Sync to Calendar
        </a>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {active ? (
          <InProgressCard workout={active} onFinished={() => { fetchWorkouts(); loadAnalytics(); }} />
        ) : (
          <Card className="lg:col-span-2">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <Badge variant="info" className="mb-3">Next Session</Badge>
                <h2 className="mb-2 text-2xl font-medium text-text">{nextWorkout ? workoutName(nextWorkout) : 'No upcoming workouts'}</h2>
                <p className="mb-6 text-text-muted">
                  {nextWorkout ? new Date(nextWorkout.scheduled_date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Build a routine in Templates to get going.'}
                </p>
                <NextSessionTimer targetDate={nextWorkout?.scheduled_date} />
              </div>
              {nextWorkout && (
                <Button onClick={() => navigate(`/workout/${nextWorkout.id}`)} className="w-full md:w-auto">
                  Start Workout <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              )}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="mb-4 text-lg font-medium text-text">Weekly Stats</h3>
          <div className="space-y-3">
            {[
              { icon: Activity, color: 'text-accent', label: 'Workouts', value: `${week.completed} / ${week.planned}` },
              { icon: Dumbbell, color: 'text-success', label: 'Sets Completed', value: week.sets.toLocaleString() },
              { icon: BarChart3, color: 'text-warning', label: 'Volume (kg)', value: week.volume.toLocaleString() },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-raised p-3">
                <div className="flex items-center gap-3 text-text-muted"><Icon className={`h-4 w-4 ${color}`} /><span className="text-sm">{label}</span></div>
                <span className="font-medium tabular-nums text-text">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex h-96 flex-col lg:col-span-2">
          <h3 className="mb-6 text-lg font-medium text-text">Volume Progress</h3>
          {hasVolume ? (
            <div className="min-h-[250px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '0.75rem', color: 'var(--text)' }}
                    itemStyle={{ color: 'var(--accent)' }}
                    formatter={(v) => [`${v.toLocaleString()} kg`, 'Volume']}
                    labelFormatter={(l) => `Week of ${l}`}
                  />
                  <Area type="monotone" dataKey="volume" stroke="var(--accent)" strokeWidth={1.75} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-text-muted">
              Complete your first workout to see your volume trend.
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-6 text-lg font-medium text-text">Weekly Heatmap</h3>
          <div className="mb-6 grid grid-cols-7 gap-2">
            {heatmap.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-md border border-border ${HEAT[d.level] || HEAT[0]} cursor-default transition-colors duration-200 hover:border-accent`}
                  title={`${d.day}: ${d.volume.toLocaleString()} kg`}
                />
                <span className="text-xs text-text-muted">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-6 text-xs text-text-muted">
            <span>Less</span>
            <div className="flex gap-1">{HEAT.map((c) => <div key={c} className={`h-3 w-3 rounded-sm border border-border ${c}`} />)}</div>
            <span>More</span>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-medium text-text">Monthly Volume</h3>
          <MonthlyVolumeChart data={monthly} />
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-medium text-text">Muscle Recovery</h3>
          <MuscleBodyMap recovery={recovery} />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
