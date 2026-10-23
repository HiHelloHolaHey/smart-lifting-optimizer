import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Dumbbell, ChevronRight, History, Play, SlidersHorizontal, CalendarClock, SkipForward, Plus, Trash2, Sun, Moon } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { schedule as scheduleApi, workouts as workoutsApi } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';
import TimeInput from '../components/ui/TimeInput';
import { workoutName } from '../utils/labels';

const DAYS = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

const weekStartOf = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

const toDateInputValue = (iso) => {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toTimeInputValue = (iso) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

const ScheduleEditorModal = ({ isOpen, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sameGym, setSameGym] = useState(true);
  const [gymOpenTime, setGymOpenTime] = useState('06:00');
  const [gymCloseTime, setGymCloseTime] = useState('22:00');
  const [preferredFrequency, setPreferredFrequency] = useState(4);
  const [goalPriority, setGoalPriority] = useState('morning');
  const [busyTimes, setBusyTimes] = useState([]);
  const [newDay, setNewDay] = useState('monday');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    scheduleApi
      .get()
      .then(({ data }) => {
        const open = (data.gym_open_time || '06:00').slice(0, 5);
        const close = (data.gym_close_time || '22:00').slice(0, 5);
        setSameGym(!(open === '00:00' && close === '23:59'));
        setGymOpenTime(open === '00:00' ? '06:00' : open);
        setGymCloseTime(close === '23:59' ? '22:00' : close);
        setPreferredFrequency(Number(data.preferred_frequency) || 4);
        setGoalPriority(data.goal_priority === 'evening' ? 'evening' : 'morning');
        setBusyTimes(Array.isArray(data.busy_times_json) ? data.busy_times_json : []);
      })
      .catch(() => setError('Could not load current schedule settings.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const addBusyBlock = () => {
    if (newEnd <= newStart) {
      setError('Busy block end time must be after start time.');
      return;
    }
    setError('');
    setBusyTimes((prev) => [...prev, { day: newDay, start: newStart, end: newEnd }]);
  };

  const removeBusyBlock = (idx) => {
    setBusyTimes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (sameGym && gymCloseTime <= gymOpenTime) {
      setError('Gym closing time must be after opening time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await scheduleApi.generate({
        ...(sameGym ? { gymOpenTime, gymCloseTime } : {}),
        busyTimes,
        preferredFrequency,
        goalPriority,
        realignWorkouts: true,
      });
      await onSaved('Schedule updated and upcoming workouts realigned.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit training schedule">
      {loading ? (
        <p className="py-6 text-center text-sm text-text-muted">Loading schedule preferences...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-border bg-raised p-3.5">
            <div>
              <div className="text-sm font-medium text-text">Fixed gym operating hours</div>
              <div className="text-xs text-text-muted">Constrain workout suggestions to your gym's hours</div>
            </div>
            <Switch checked={sameGym} onCheckedChange={setSameGym} aria-label="Fixed gym operating hours" />
          </div>

          {sameGym && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TimeInput id="sched-open" label="Gym opens" value={gymOpenTime} onChange={setGymOpenTime} />
              <TimeInput id="sched-close" label="Gym closes" value={gymCloseTime} onChange={setGymCloseTime} />
            </div>
          )}

          <div>
            <Label>Preferred training window</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'morning', label: 'Morning', icon: Sun },
                { id: 'evening', label: 'Evening', icon: Moon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGoalPriority(id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    goalPriority === id
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-raised text-text-muted hover:text-text'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Weekly frequency</Label>
              <span className="font-mono text-sm font-semibold text-accent">
                {preferredFrequency} {preferredFrequency === 1 ? 'day' : 'days'} / week
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={preferredFrequency}
              onChange={(e) => setPreferredFrequency(Number(e.target.value))}
              aria-label="Weekly frequency"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-raised accent-accent"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-raised/60 p-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Weekly busy times</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_6.5rem_6.5rem_auto]">
              <select
                aria-label="Busy day"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="input-field !py-2 text-sm capitalize"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id}
                  </option>
                ))}
              </select>
              <Input
                type="time"
                aria-label="Busy start time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="!py-2 text-xs"
              />
              <Input
                type="time"
                aria-label="Busy end time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="!py-2 text-xs"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addBusyBlock}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {busyTimes.length > 0 ? (
              <ul className="max-h-32 space-y-1.5 overflow-y-auto pt-1">
                {busyTimes.map((b, idx) => (
                  <li
                    key={`${b.day}-${b.start}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
                  >
                    <span className="capitalize text-text">
                      <b>{b.day}</b> · <span className="font-mono text-text-muted">{b.start} – {b.end}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBusyBlock(idx)}
                      aria-label={`Remove ${b.day} busy block`}
                      className="text-text-muted hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">No busy blocks added yet.</p>
            )}
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
            <Button type="submit" loading={saving}>
              Save & Realign Workouts
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

const RescheduleModal = ({ workout, onClose, onSaved }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workout) {
      setDate(toDateInputValue(workout.scheduled_date));
      setTime(toTimeInputValue(workout.scheduled_date));
      setError('');
    }
  }, [workout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Select both a date and time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const iso = new Date(`${date}T${time}:00`).toISOString();
      await workoutsApi.reschedule(workout.id, iso);
      await onSaved(`Rescheduled ${workoutName(workout)} to ${new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}.`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reschedule workout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(workout)} onClose={onClose} title={`Reschedule ${workout ? workoutName(workout) : ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="rs-date">New date</Label>
          <Input id="rs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <TimeInput id="rs-time" label="New start time" value={time} onChange={setTime} />
        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save new date
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/** Upcoming + in-progress workouts. Finished ones live in the Profile page history. */
const WorkoutsPage = () => {
  const { workouts, fetchWorkouts, loading } = useWorkout();
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSaved = async (msg) => {
    await fetchWorkouts();
    if (msg) setToast(msg);
  };

  const handleSkip = async (e, w) => {
    e.stopPropagation();
    try {
      await workoutsApi.updateStatus(w.id, 'skipped');
      await fetchWorkouts();
      setToast(`Skipped ${workoutName(w)}.`);
    } catch {
      setToast('Could not skip workout.');
    }
  };

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
    <Card
      onClick={() => navigate(`/workout/${w.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/workout/${w.id}`);
        }
      }}
      className="group flex cursor-pointer items-center justify-between gap-4 !p-4 transition-colors hover:border-accent/50"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="rounded-xl border border-border bg-raised p-3 text-accent">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium text-text">{workoutName(w)}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(w.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            <span className="text-border">·</span>
            {w.total_sets} sets
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {w.status === 'scheduled' && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setRescheduleTarget(w)}
              aria-label={`Reschedule ${workoutName(w)}`}
              title="Reschedule workout"
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-raised hover:text-accent"
            >
              <CalendarClock className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleSkip(e, w)}
              aria-label={`Skip ${workoutName(w)}`}
              title="Skip workout"
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-warning/15 hover:text-warning"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        )}
        {w.status === 'active' ? <Badge variant="success">In progress</Badge> : <Badge variant="default">Scheduled</Badge>}
        <ChevronRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-text" />
      </div>
    </Card>
  );

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-medium text-text">Workouts</h1>
          <p className="text-text-muted">Your scheduled sessions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Edit schedule
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/profile#history">
              <History className="h-4 w-4" /> Completed workouts ({completedCount})
            </Link>
          </Button>
        </div>
      </header>

      {toast && (
        <div role="status" className="mb-6 rounded-xl border border-success/40 bg-success/15 px-4 py-3 text-sm text-success">
          {toast}
        </div>
      )}

      {active && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-success">
            <Play className="h-4 w-4" /> In progress
          </h2>
          <Row w={active} />
        </section>
      )}

      {groups.length === 0 && !active && !loading && (
        <Card className="py-14 text-center">
          <p className="text-text">Nothing scheduled right now.</p>
          <p className="mt-1 text-sm text-text-muted">
            Create a routine in{' '}
            <Link to="/templates" className="text-accent hover:underline">
              Templates
            </Link>{' '}
            to add a session.
          </p>
        </Card>
      )}

      <div className="space-y-8">
        {groups.map(([weekStart, list]) => (
          <section key={weekStart}>
            <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h2>
            <div className="space-y-3">
              {list.map((w) => (
                <Row key={w.id} w={w} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ScheduleEditorModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} onSaved={handleSaved} />
      <RescheduleModal workout={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSaved={handleSaved} />
    </div>
  );
};

export default WorkoutsPage;
