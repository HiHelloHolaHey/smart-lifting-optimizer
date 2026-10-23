import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pencil, Mail, Ruler, Weight, Target, Trophy, Flame, Dumbbell, Clock, BarChart3, ChevronDown, CalendarCheck, Activity, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { analytics } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Modal } from '../components/ui/Modal';
import { GOAL_LABELS, LEVEL_LABELS, workoutName, formatDuration, calculateBmi } from '../utils/labels';

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
        firstName: user.first_name || '',
        heightCm: user.height_cm ? String(Number(user.height_cm)) : '',
        weightKg: user.weight_kg ? String(Number(user.weight_kg)) : '',
        goal: user.goal || 'hypertrophy',
        experienceLevel: user.experience_level || 'beginner',
      });
      setError('');
      setField('');
    }
  }, [isOpen, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const previewBmi = useMemo(() => calculateBmi(form.heightCm, form.weightKg), [form.heightCm, form.weightKg]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setField('');
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        ...(form.heightCm !== '' && { heightCm: Number(form.heightCm) }),
        ...(form.weightKg !== '' && { weightKg: Number(form.weightKg) }),
        goal: form.goal,
        experienceLevel: form.experienceLevel,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't save your changes. Check your connection and try again.");
      setField(err.response?.data?.field || '');
    } finally {
      setSaving(false);
    }
  };

  const chip = (active) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
      active
        ? 'border-accent bg-accent/15 text-accent'
        : 'border-border bg-raised text-text-muted hover:border-accent/40 hover:text-text'
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="pf-name">First name</Label>
          <Input
            id="pf-name"
            error={field === 'firstName'}
            value={form.firstName || ''}
            maxLength={50}
            onChange={(e) => set('firstName', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pf-h">Height (cm)</Label>
            <Input
              id="pf-h"
              type="number"
              inputMode="decimal"
              error={field === 'heightCm'}
              value={form.heightCm || ''}
              onChange={(e) => set('heightCm', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pf-w">Weight (kg)</Label>
            <Input
              id="pf-w"
              type="number"
              inputMode="decimal"
              step="0.1"
              error={field === 'weightKg'}
              value={form.weightKg || ''}
              onChange={(e) => set('weightKg', e.target.value)}
            />
          </div>
        </div>
        {previewBmi && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-raised px-3.5 py-2.5 text-xs">
            <span className="text-text-muted">Calculated BMI</span>
            <span className="flex items-center gap-2 font-mono font-semibold text-text">
              {previewBmi.bmi.toFixed(1)}
              <Badge variant={previewBmi.variant}>{previewBmi.category}</Badge>
            </span>
          </div>
        )}
        <div>
          <Label>Goal</Label>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(([id, label]) => (
              <button type="button" key={id} className={chip(form.goal === id)} onClick={() => set('goal', id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Experience</Label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(([id, label]) => (
              <button type="button" key={id} className={chip(form.experienceLevel === id)} onClick={() => set('experienceLevel', id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!form.firstName?.trim()}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const Stat = ({ icon: Icon, label, value, sub, color = 'text-accent' }) => (
  <Card className="!p-4">
    <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
      <Icon className={`h-4 w-4 ${color}`} />
      {label}
    </div>
    <div className="font-mono text-2xl font-semibold tabular-nums text-text">{value}</div>
    {sub && <div className="mt-0.5 text-xs text-text-muted">{sub}</div>}
  </Card>
);

const BmiCard = ({ bmiInfo, heightCm, weightKg, onEdit }) => {
  // Position marker along a 14..34 BMI scale
  const markerPct = bmiInfo ? Math.min(98, Math.max(2, ((bmiInfo.bmi - 14) / (34 - 14)) * 100)) : null;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <h3 className="text-lg font-medium text-text">Body Mass Index (BMI)</h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            {heightCm && weightKg
              ? `Based on ${Number(heightCm)} cm and ${Number(weightKg)} kg`
              : 'Add your height and weight to calculate your BMI'}
          </p>
        </div>
        {bmiInfo ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-semibold tabular-nums text-text">{bmiInfo.bmi.toFixed(1)}</span>
            <Badge variant={bmiInfo.variant}>{bmiInfo.category}</Badge>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Set height & weight
          </Button>
        )}
      </div>

      {bmiInfo && (
        <div className="mt-4">
          {/* Scale bar: 14 to 34 (18.5 is 22.5% along the bar, 25.0 is 55% along the bar) */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-raised">
            <div className="absolute inset-y-0 left-0 w-[22.5%] bg-warning/50" title="Underweight (< 18.5)" />
            <div className="absolute inset-y-0 left-[22.5%] w-[32.5%] bg-success/60" title="Normal (18.5 – 24.9)" />
            <div className="absolute inset-y-0 left-[55%] right-0 bg-warning/50" title="Overweight (≥ 25.0)" />
            <div
              className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow ring-2 ring-surface"
              style={{ left: `${markerPct}%` }}
              aria-label={`Your BMI marker at ${bmiInfo.bmi}`}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-text-muted">
            <span>Underweight (&lt;18.5)</span>
            <span>Normal (18.5–24.9)</span>
            <span>Overweight (≥25.0)</span>
          </div>
        </div>
      )}
    </Card>
  );
};

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
    () =>
      workouts
        .filter((w) => w.status === 'completed')
        .sort((a, b) => new Date(b.ended_at || b.scheduled_date) - new Date(a.ended_at || a.scheduled_date)),
    [workouts]
  );

  const bmiInfo = useMemo(() => calculateBmi(user?.height_cm, user?.weight_kg), [user?.height_cm, user?.weight_kg]);

  const info = [
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'Height', value: user?.height_cm ? `${Number(user.height_cm)} cm` : null, icon: Ruler },
    { label: 'Weight', value: user?.weight_kg ? `${Number(user.weight_kg)} kg` : null, icon: Weight },
    {
      label: 'BMI',
      value: bmiInfo ? (
        <span className="inline-flex items-center gap-2 font-mono">
          {bmiInfo.bmi.toFixed(1)}
          <Badge variant={bmiInfo.variant}>{bmiInfo.category}</Badge>
        </span>
      ) : null,
      icon: Activity,
    },
    { label: 'Goal', value: GOAL_LABELS[user?.goal], icon: Target },
    { label: 'Experience', value: LEVEL_LABELS[user?.experience_level], icon: Trophy },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="mb-1 text-3xl font-medium text-text">Profile</h1>
        <p className="text-text-muted">Your details, body metrics, and training history</p>
      </header>

      <div className="max-w-4xl space-y-6">
        <Card className="flex flex-wrap items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-raised font-display text-3xl font-medium text-accent">
            {(user?.first_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-medium text-text">{user?.first_name || 'Add your name'}</h2>
            <p className="mt-1 text-text-muted">{LEVEL_LABELS[user?.experience_level] || 'Experience not set'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user?.goal && <Badge variant="info">{GOAL_LABELS[user.goal]}</Badge>}
              {bmiInfo && <Badge variant={bmiInfo.variant}>BMI {bmiInfo.bmi.toFixed(1)} · {bmiInfo.category}</Badge>}
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
        </Card>

        <BmiCard
          bmiInfo={bmiInfo}
          heightCm={user?.height_cm}
          weightKg={user?.weight_kg}
          onEdit={() => setEditing(true)}
        />

        <Card>
          <h3 className="mb-2 text-lg font-medium text-text">Account info</h3>
          <div className="divide-y divide-border">
            {info.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 text-text-muted">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="text-sm font-medium text-text">{value || '—'}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 text-text-muted">
                <CalendarCheck className="h-4 w-4" />
                <span className="text-sm">Member since</span>
              </div>
              <span className="text-sm font-medium text-text">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
        </Card>

        <section aria-label="Training stats">
          <h3 className="mb-3 text-lg font-medium text-text">Training stats</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Dumbbell} label="Workouts done" value={stats?.workouts ?? 0} color="text-accent" />
            <Stat
              icon={BarChart3}
              label="Total volume"
              value={`${(stats?.volume ?? 0).toLocaleString()} kg`}
              sub={`${stats?.sets ?? 0} working sets`}
              color="text-warning"
            />
            <Stat
              icon={Clock}
              label="Avg. duration"
              value={stats?.avg_minutes != null ? `${stats.avg_minutes} min` : '—'}
              color="text-ai"
            />
            <Stat icon={Flame} label="Week streak" value={stats?.streak_weeks ?? 0} sub="consecutive weeks" color="text-success" />
          </div>

          {(stats?.top_lifts?.length > 0 || stats?.one_rep_maxes?.length > 0 || stats?.favourite_muscle) && (
            <Card className="mt-4">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Heaviest logged sets</div>
                  {stats?.top_lifts?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {stats.top_lifts.map((l) => (
                        <li key={l.name} className="flex justify-between text-sm">
                          <span className="text-text-muted">{l.name}</span>
                          <span className="font-mono font-semibold text-text">
                            {l.max_kg} kg × {l.reps}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted">Log working sets to see your top lifts.</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <Award className="h-3.5 w-3.5 text-accent" /> Estimated 1RM (PRs)
                  </div>
                  {stats?.one_rep_maxes?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {stats.one_rep_maxes.map((orm) => (
                        <li key={orm.name} className="flex justify-between text-sm">
                          <span className="truncate pr-2 text-text-muted">{orm.name}</span>
                          <span className="shrink-0 font-mono font-semibold text-accent">{orm.estimated_1rm_kg} kg</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted">Calculated automatically via Epley formula.</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Most trained</div>
                  <div className="text-lg font-semibold capitalize text-text">{stats.favourite_muscle || '—'}</div>
                </div>
              </div>
            </Card>
          )}
          {stats && stats.workouts === 0 && (
            <p className="mt-3 text-sm text-text-muted">Workout volume stats appear here after you finish your first session.</p>
          )}
        </section>

        <section id="history" aria-label="Completed workouts">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            aria-expanded={showHistory}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-colors hover:border-accent/50"
          >
            <span className="font-medium text-text">
              Completed workouts <span className="ml-1 text-text-muted">({completed.length})</span>
            </span>
            <ChevronDown className={`h-5 w-5 text-text-muted transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          {showHistory && (
            <div className="mt-3 space-y-3">
              {completed.length === 0 && <p className="px-2 py-6 text-center text-sm text-text-muted">No completed workouts yet.</p>}
              {completed.slice(0, visible).map((w) => (
                <button key={w.id} type="button" onClick={() => navigate(`/workout/${w.id}`)} className="w-full text-left">
                  <Card className="flex flex-wrap items-center justify-between gap-3 !p-4 transition-colors hover:border-accent/50">
                    <div>
                      <div className="font-medium text-text">{workoutName(w)}</div>
                      <div className="text-xs text-text-muted">
                        {new Date(w.ended_at || w.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="flex gap-4 font-mono text-xs text-text-muted">
                      <span>{w.completed_sets} sets</span>
                      <span>{Math.round(w.volume).toLocaleString()} kg</span>
                      {formatDuration(w.started_at, w.ended_at) && <span>{formatDuration(w.started_at, w.ended_at)}</span>}
                    </div>
                  </Card>
                </button>
              ))}
              {completed.length > visible && (
                <Button type="button" variant="ghost" onClick={() => setVisible((v) => v + 10)} className="w-full">
                  Show more
                </Button>
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
