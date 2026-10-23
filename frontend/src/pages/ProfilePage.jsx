import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pencil, Mail, Ruler, Weight, Target, Trophy, Flame, Dumbbell, Clock, BarChart3, ChevronDown, CalendarCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { analytics } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { GOAL_LABELS, LEVEL_LABELS, workoutName, formatDuration } from '../utils/labels';

const GOALS = Object.entries(GOAL_LABELS);
const LEVELS = Object.entries(LEVEL_LABELS);

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [field, setField] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setForm({
        firstName: user.first_name || '', heightCm: user.height_cm ? String(Number(user.height_cm)) : '',
        weightKg: user.weight_kg ? String(Number(user.weight_kg)) : '', goal: user.goal || 'hypertrophy', experienceLevel: user.experience_level || 'beginner',
      });
      setError(''); setField('');
    }
  }, [isOpen, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setField('');
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        ...(form.heightCm !== '' && { heightCm: Number(form.heightCm) }),
        ...(form.weightKg !== '' && { weightKg: Number(form.weightKg) }),
        goal: form.goal, experienceLevel: form.experienceLevel,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't save your changes. Check your connection and try again.");
      setField(err.response?.data?.field || '');
    } finally {
      setSaving(false);
    }
  };

  const cls = (name) => `input-field ${field === name ? '!border-red-500' : ''}`;
  const chip = (active) => `rounded-xl border px-3 py-2 text-sm transition-all ${active ? 'border-electric-indigo bg-indigo-500/10 text-indigo-300' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="pf-name" className="mb-1.5 block text-sm font-medium text-slate-400">First name</label>
          <input id="pf-name" className={cls('firstName')} value={form.firstName || ''} maxLength={50} onChange={(e) => set('firstName', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pf-h" className="mb-1.5 block text-sm font-medium text-slate-400">Height (cm)</label>
            <input id="pf-h" type="number" inputMode="decimal" className={cls('heightCm')} value={form.heightCm || ''} onChange={(e) => set('heightCm', e.target.value)} />
          </div>
          <div>
            <label htmlFor="pf-w" className="mb-1.5 block text-sm font-medium text-slate-400">Weight (kg)</label>
            <input id="pf-w" type="number" inputMode="decimal" step="0.1" className={cls('weightKg')} value={form.weightKg || ''} onChange={(e) => set('weightKg', e.target.value)} />
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-400">Goal</span>
          <div className="grid grid-cols-2 gap-2">{GOALS.map(([id, label]) => <button type="button" key={id} className={chip(form.goal === id)} onClick={() => set('goal', id)}>{label}</button>)}</div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-400">Experience</span>
          <div className="grid grid-cols-3 gap-2">{LEVELS.map(([id, label]) => <button type="button" key={id} className={chip(form.experienceLevel === id)} onClick={() => set('experienceLevel', id)}>{label}</button>)}</div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving || !form.firstName?.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Stat = ({ icon: Icon, label, value, sub, color = 'text-indigo-400' }) => (
  <Card className="!p-4">
    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><Icon className={`h-4 w-4 ${color}`} />{label}</div>
    <div className="text-2xl font-bold text-slate-100">{value}</div>
    {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
  </Card>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const { workouts, fetchWorkouts } = useWorkout();
  const navigate = useNavigate();
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [showHistory, setShowHistory] = useState(location.hash === '#history');
  const [visible, setVisible] = useState(10);

  useEffect(() => {
    fetchWorkouts();
    analytics.profileStats().then(({ data }) => setStats(data)).catch(() => {});
  }, [fetchWorkouts]);

  useEffect(() => {
    if (location.hash === '#history') {
      setShowHistory(true);
      setTimeout(() => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  const completed = useMemo(
    () => workouts.filter((w) => w.status === 'completed').sort((a, b) => new Date(b.ended_at || b.scheduled_date) - new Date(a.ended_at || a.scheduled_date)),
    [workouts]
  );

  const info = [
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'Height', value: user?.height_cm ? `${Number(user.height_cm)} cm` : null, icon: Ruler },
    { label: 'Weight', value: user?.weight_kg ? `${Number(user.weight_kg)} kg` : null, icon: Weight },
    { label: 'Goal', value: GOAL_LABELS[user?.goal], icon: Target },
    { label: 'Experience', value: LEVEL_LABELS[user?.experience_level], icon: Trophy },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="mb-1 text-3xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-400">Your details and training history</p>
      </header>

      <div className="max-w-4xl space-y-6">
        <Card className="flex flex-wrap items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-raised font-display text-3xl font-medium text-accent">
            {(user?.first_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold text-slate-100">{user?.first_name || 'Add your name'}</h2>
            <p className="mt-1 text-slate-400">{LEVEL_LABELS[user?.experience_level] || 'Experience not set'}</p>
            <div className="mt-2">{user?.goal && <Badge variant="info">{GOAL_LABELS[user.goal]}</Badge>}</div>
          </div>
          <button type="button" onClick={() => setEditing(true)} className="btn-ghost flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit profile</button>
        </Card>

        <Card>
          <h3 className="mb-2 text-lg font-semibold text-slate-100">Account info</h3>
          <div className="divide-y divide-slate-800">
            {info.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 text-slate-400"><Icon className="h-4 w-4" /><span className="text-sm">{label}</span></div>
                <span className="text-sm font-medium text-slate-200">{value || '—'}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 text-slate-400"><CalendarCheck className="h-4 w-4" /><span className="text-sm">Member since</span></div>
              <span className="text-sm font-medium text-slate-200">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
            </div>
          </div>
        </Card>

        <section aria-label="Training stats">
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Training stats</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Dumbbell} label="Workouts done" value={stats?.workouts ?? 0} color="text-accent" />
            <Stat icon={BarChart3} label="Total volume" value={`${(stats?.volume ?? 0).toLocaleString()} kg`} sub={`${stats?.sets ?? 0} working sets`} color="text-warning" />
            <Stat icon={Clock} label="Avg. duration" value={stats?.avg_minutes != null ? `${stats.avg_minutes} min` : '—'} color="text-ai" />
            <Stat icon={Flame} label="Week streak" value={stats?.streak_weeks ?? 0} sub="consecutive weeks" color="text-success" />
          </div>
          {(stats?.top_lifts?.length > 0 || stats?.favourite_muscle) && (
            <Card className="mt-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Heaviest lifts</div>
                  <ul className="space-y-1.5">
                    {stats.top_lifts.map((l) => (
                      <li key={l.name} className="flex justify-between text-sm"><span className="text-slate-300">{l.name}</span><span className="font-semibold text-slate-100">{l.max_kg} kg × {l.reps}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Most trained</div>
                  <div className="text-lg font-semibold capitalize text-slate-100">{stats.favourite_muscle || '—'}</div>
                </div>
              </div>
            </Card>
          )}
          {stats && stats.workouts === 0 && <p className="mt-3 text-sm text-slate-500">Stats appear here after you finish your first workout.</p>}
        </section>

        <section id="history" aria-label="Completed workouts">
          <button
            type="button" onClick={() => setShowHistory((s) => !s)} aria-expanded={showHistory}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 px-5 py-4 text-left backdrop-blur-md transition-colors hover:border-indigo-500/40"
          >
            <span className="font-semibold text-slate-100">Completed workouts <span className="ml-1 text-slate-500">({completed.length})</span></span>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          {showHistory && (
            <div className="mt-3 space-y-3">
              {completed.length === 0 && <p className="px-2 py-6 text-center text-sm text-slate-500">No completed workouts yet.</p>}
              {completed.slice(0, visible).map((w) => (
                <button key={w.id} type="button" onClick={() => navigate(`/workout/${w.id}`)} className="w-full text-left">
                  <Card className="flex flex-wrap items-center justify-between gap-3 !p-4 transition-colors hover:border-indigo-500/40">
                    <div>
                      <div className="font-semibold text-slate-100">{workoutName(w)}</div>
                      <div className="text-xs text-slate-500">{new Date(w.ended_at || w.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>{w.completed_sets} sets</span>
                      <span>{Math.round(w.volume).toLocaleString()} kg</span>
                      {formatDuration(w.started_at, w.ended_at) && <span>{formatDuration(w.started_at, w.ended_at)}</span>}
                    </div>
                  </Card>
                </button>
              ))}
              {completed.length > visible && (
                <button type="button" onClick={() => setVisible((v) => v + 10)} className="btn-ghost w-full">Show more</button>
              )}
            </div>
          )}
        </section>
      </div>

      <EditProfileModal isOpen={editing} onClose={() => setEditing(false)} />
    </div>
  );
};

export default ProfilePage;
