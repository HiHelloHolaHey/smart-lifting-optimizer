import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, TrendingUp, Sparkles, Plus, Flame, Timer, Play, Trash2, X } from 'lucide-react';
import { workouts as workoutsApi, ai, exerciseCatalog } from '../api/endpoints';
import { useProgressOverload } from '../hooks/useProgressOverload';
import { usePersistentState } from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SetRow from '../components/workout/SetRow';
import RestTimer from '../components/workout/RestTimer';
import ExerciseNotes from '../components/workout/ExerciseNotes';
import SwapModal from '../components/workout/SwapModal';
import ExercisePicker from '../components/workout/ExercisePicker';
import { workoutName, formatClock } from '../utils/labels';
import { groupExercises, hasValue, useNow } from '../utils/workoutSets';

const REST_SECONDS = { working: 120, warmup: 60 };
const NOTE_AUTOSAVE_MS = 800;

/** Principle: Use the AI blue (--ai) on its soft tint (--ai-tint) for coach insights. */
const OverloadChip = ({ exerciseId }) => {
  const { suggestion, loading } = useProgressOverload(exerciseId);
  if (loading || !suggestion || suggestion.suggested_weight_kg === undefined) return null;
  return (
    <div
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-ai/25 bg-ai-tint px-2.5 py-1 text-xs font-medium text-ai"
      title={suggestion.increment_reason}
    >
      <TrendingUp className="h-3.5 w-3.5" />
      Suggested: {suggestion.suggested_weight_kg}kg × {suggestion.suggested_reps}
      {suggestion.source === 'ai' && <Sparkles className="h-3 w-3 text-ai" aria-label="AI-adjusted" />}
    </div>
  );
};

/** 2-sentence AI coaching brief on --ai-tint (#1F2633) with --ai (#8FA1C4) label/icon. */
const CoachBrief = ({ workoutId }) => {
  const [brief, setBrief] = usePersistentState(`brief-${workoutId}`, null);
  const [loading, setLoading] = useState(!brief);

  useEffect(() => {
    if (brief) return undefined;
    let alive = true;
    ai.preWorkoutBrief(workoutId)
      .then(({ data }) => alive && setBrief({ text: data.brief, source: data.source }))
      .catch(() => alive && setBrief(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [workoutId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !brief) return null;
  return (
    <div className="rounded-2xl border border-ai/25 bg-ai-tint p-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ai">
        <Sparkles className="h-4 w-4" />{brief?.source === 'ai' ? 'AI Coach' : 'Coach'}
      </div>
      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-3 w-full animate-pulse rounded bg-raised" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-raised" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-text">{brief.text}</p>
      )}
    </div>
  );
};

const WorkoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const now = useNow(1000);

  const [workout, setWorkout] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [noteStatus, setNoteStatus] = useState({});
  const noteTimers = useRef({});

  const [draft, setDraft, clearDraft] = usePersistentState(`workout-draft-${id}`, { inputs: {}, notes: {}, rest: null });

  const load = useCallback(async () => {
    try {
      const { data } = await workoutsApi.getById(id);
      setWorkout(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Failed to load workout.');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { exerciseCatalog.list().then(({ data }) => setCatalog(data)).catch(() => {}); }, []);
  useEffect(() => () => Object.values(noteTimers.current).forEach(clearTimeout), []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const status = workout?.status;
  const isActive = status === 'active';
  const isDone = status === 'completed';

  const previousMap = useMemo(() => {
    const m = {};
    (workout?.previous || []).forEach((p) => { m[`${p.exercise_id}-${p.set_type}-${p.set_number}`] = p; });
    return m;
  }, [workout?.previous]);
  const prevFor = (set) => previousMap[`${set.exercise_id}-${set.set_type}-${set.set_number}`];

  const exercises = useMemo(() => groupExercises(workout?.sets), [workout?.sets]);
  const workoutExerciseIds = useMemo(() => exercises.map((e) => e.exercise_id), [exercises]);

  const valuesFor = (set) => {
    if (draft.inputs[set.id]) return draft.inputs[set.id];
    const prev = prevFor(set);
    if (set.completed) return { weight: hasValue(set.weight_kg) ? Number(set.weight_kg) : '', reps: set.reps ?? '' };
    return {
      weight: hasValue(set.weight_kg) ? Number(set.weight_kg) : prev && hasValue(prev.weight_kg) ? Number(prev.weight_kg) : '',
      reps: prev?.reps ?? set.reps ?? '',
    };
  };
  const placeholdersFor = (set) => {
    const prev = prevFor(set);
    return { weight: prev && hasValue(prev.weight_kg) ? String(Number(prev.weight_kg)) : 'kg', reps: set.reps ? String(set.reps) : 'reps' };
  };
  const notesFor = (ex) => draft.notes[ex.exercise_id] ?? workout.notes_by_exercise?.[ex.exercise_id] ?? '';

  const patchSet = (setId, patch) => setWorkout((w) => ({ ...w, sets: w.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }));
  const fail = (err, fallback) => setError({ text: err?.response?.data?.error || fallback, activeId: err?.response?.data?.active_workout_id });

  const handleInput = (set, field, value) =>
    setDraft((d) => ({ ...d, inputs: { ...d.inputs, [set.id]: { ...valuesFor(set), [field]: value } } }));

  const startNow = async () => {
    setBusy(true); setError(null);
    try {
      const { data } = await workoutsApi.start(id);
      setWorkout((w) => ({ ...w, status: data.status, started_at: data.started_at }));
    } catch (err) {
      fail(err, 'Could not start the workout.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (set) => {
    if (!isActive) return;
    const nowDone = !set.completed;
    const v = valuesFor(set);
    const weight = v.weight === '' ? 0 : Number(v.weight);
    const reps = v.reps === '' ? NaN : parseInt(v.reps, 10);
    if (nowDone && !(reps > 0)) { setError({ text: 'Enter the reps you did before ticking the set.' }); return; }

    setError(null);
    patchSet(set.id, { completed: nowDone, weight_kg: weight, reps: nowDone ? reps : set.reps });
    setDraft((d) => ({
      ...d,
      inputs: { ...d.inputs, [set.id]: { weight: v.weight, reps: v.reps } },
      rest: nowDone ? { setId: set.id, endsAt: Date.now() + REST_SECONDS[set.set_type] * 1000, total: REST_SECONDS[set.set_type] } : d.rest?.setId === set.id ? null : d.rest,
    }));

    try {
      await workoutsApi.updateSet(id, set.id, { weight_kg: weight, reps: Number.isNaN(reps) ? null : reps, completed: nowDone });
    } catch (err) {
      patchSet(set.id, { completed: set.completed });
      setDraft((d) => ({ ...d, rest: null }));
      fail(err, 'Could not save that set. Your numbers are kept — try again.');
    }
  };

  const saveNotes = async (ex, text) => {
    clearTimeout(noteTimers.current[ex.exercise_id]);
    setNoteStatus((s) => ({ ...s, [ex.exercise_id]: 'saving' }));
    try {
      await workoutsApi.saveNotes(id, ex.exercise_id, text);
      setNoteStatus((s) => ({ ...s, [ex.exercise_id]: 'saved' }));
      setWorkout((w) => ({ ...w, notes_by_exercise: { ...w.notes_by_exercise, [ex.exercise_id]: text } }));
    } catch {
      setNoteStatus((s) => ({ ...s, [ex.exercise_id]: 'error' }));
    }
  };
  const changeNotes = (ex, text) => {
    setDraft((d) => ({ ...d, notes: { ...d.notes, [ex.exercise_id]: text } }));
    setNoteStatus((s) => ({ ...s, [ex.exercise_id]: 'saving' }));
    clearTimeout(noteTimers.current[ex.exercise_id]);
    noteTimers.current[ex.exercise_id] = setTimeout(() => saveNotes(ex, text), NOTE_AUTOSAVE_MS);
  };

  const addSet = async (ex, setType) => {
    try {
      const last = [...ex.sets].reverse().find((s) => s.set_type === setType) || ex.sets[ex.sets.length - 1];
      const { data } = await workoutsApi.addSet(id, {
        exercise_id: ex.exercise_id, set_type: setType,
        weight_kg: setType === 'warmup' ? null : last?.weight_kg ?? null, reps: last?.reps ?? null,
      });
      setWorkout((w) => ({ ...w, sets: [...w.sets, { ...data, exercise_name: ex.exercise_name, muscle_group: ex.muscle_group }] }));
    } catch (err) {
      fail(err, 'Could not add set.');
    }
  };

  const handleSwap = async (alt) => {
    const from = swapTarget;
    try {
      const { data } = await workoutsApi.swapExercise(id, from.exercise_id, alt.id);
      setSwapTarget(null);
      if (data.updated_sets === 0) setError({ text: `Nothing to swap — every set of ${from.exercise_name} is already logged. Logged sets stay as they are.` });
      else setToast(`Swapped ${from.exercise_name} → ${alt.name}${from.sets.some((s) => s.completed) ? ' (logged sets stay under the old exercise)' : ''}`);
      await load();
    } catch (err) {
      fail(err, 'Swap failed. Please try again.');
    }
  };

  const handleAddExercise = async (c) => {
    try {
      await workoutsApi.addExercise(id, { exercise_id: c.id, sets: 3, reps: 10 });
      setAddOpen(false);
      setToast(`Added ${c.name}`);
      await load();
    } catch (err) {
      setAddOpen(false);
      fail(err, 'Could not add exercise.');
    }
  };

  const handleRemoveExercise = async () => {
    const ex = removeTarget;
    setRemoveTarget(null);
    try {
      await workoutsApi.removeExercise(id, ex.exercise_id);
      setToast(`Removed ${ex.exercise_name}`);
      await load();
    } catch (err) {
      fail(err, 'Could not remove exercise.');
    }
  };

  const stats = useMemo(() => {
    const sets = workout?.sets || [];
    const done = sets.filter((s) => s.completed && s.set_type === 'working');
    return { done: sets.filter((s) => s.completed).length, total: sets.length, volume: Math.round(done.reduce((a, s) => a + Number(s.weight_kg || 0) * (s.reps || 0), 0)) };
  }, [workout]);

  const finish = async () => {
    setDialog(null); setBusy(true);
    try {
      await workoutsApi.finish(id);
      clearDraft();
      localStorage.removeItem(`brief-${id}`);
      setFinished(true);
      setTimeout(() => navigate('/dashboard'), 2200);
    } catch (err) {
      fail(err, 'Could not finish the workout. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    setDialog(null); setBusy(true);
    try {
      await workoutsApi.discard(id);
      clearDraft();
      localStorage.removeItem(`brief-${id}`);
      navigate('/workouts');
    } catch (err) {
      fail(err, 'Could not discard the workout.');
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => (isActive ? setDialog('exit') : navigate(isDone ? '/profile#history' : '/workouts'));
  const requestFinish = () => (stats.done < stats.total ? setDialog('finish') : finish());

  if (loadError) return <div className="p-10 text-center text-text-muted">{loadError}</div>;
  if (!workout) return <LoadingSpinner />;

  const elapsed = isActive && workout.started_at ? (now - new Date(workout.started_at).getTime()) / 1000 : 0;
  const progressPct = stats.total > 0 ? Math.min(100, Math.round((stats.done / stats.total) * 100)) : 0;

  return (
    <div className="relative min-h-screen bg-bg pb-24 text-text">
      {finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm">
          <div className="space-y-3 text-center">
            <div className="animate-bounce text-5xl">🎉</div>
            <h2 className="text-3xl font-medium text-accent">Workout Complete</h2>
            <p className="text-text-muted">{stats.done} sets · {stats.volume.toLocaleString()} kg volume · {formatClock(elapsed)}</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Back" onClick={goBack} className="-ml-2 rounded-lg p-2 text-text-muted hover:text-text">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-medium">{workoutName(workout)}</h1>
              <p className="text-xs text-text-muted">
                {new Date(workout.scheduled_date).toLocaleDateString()} · {stats.done}/{stats.total} sets · {stats.volume.toLocaleString()} kg
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isActive && (
              <>
                <span className="flex items-center gap-1.5 rounded-lg border border-success/35 bg-success/15 px-2.5 py-1.5 font-mono text-sm font-medium tabular-nums text-success" aria-label="Elapsed time">
                  <Timer className="h-4 w-4" />{formatClock(elapsed)}
                </span>
                <button
                  type="button"
                  onClick={() => setDialog('discard')}
                  className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/15"
                >
                  Discard
                </button>
              </>
            )}
            {!isActive && <Badge variant={isDone ? 'success' : 'info'}>{isDone ? 'completed' : 'planning'}</Badge>}
          </div>
        </div>
        {/* Thin progress line per theme guide */}
        <div className="h-0.5 w-full bg-raised">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 p-4 lg:p-8">
        {status === 'scheduled' && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
            <div>
              <div className="font-medium text-text">You're planning this session</div>
              <p className="text-sm text-text-muted">
                Adjust exercises and numbers now. Press <b>Start Now</b> when you're at the gym to start the clock and log sets.
              </p>
            </div>
            <Button onClick={startNow} loading={busy} className="w-full sm:w-auto">
              <Play className="mr-2 h-4 w-4" />Start Now
            </Button>
          </div>
        )}

        {!isDone && <CoachBrief workoutId={id} />}

        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-danger/40 bg-danger/15 px-4 py-3 text-sm text-danger">
            <span>
              {error.text}
              {error.activeId && (
                <button type="button" onClick={() => navigate(`/workout/${error.activeId}`)} className="ml-2 font-medium underline">
                  Go to it
                </button>
              )}
            </span>
            <button type="button" aria-label="Dismiss" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {toast && <div role="status" className="rounded-xl border border-success/40 bg-success/15 px-4 py-3 text-sm text-success">{toast}</div>}

        {exercises.map((ex) => (
          <Card key={ex.exercise_id} className="overflow-hidden !p-0">
            <div className="flex items-start justify-between border-b border-border bg-surface p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium text-text">{ex.exercise_name}</h3>
                  <Badge variant="default">{ex.muscle_group}</Badge>
                </div>
                <OverloadChip exerciseId={ex.exercise_id} />
              </div>
              {!isDone && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSwapTarget(ex)}
                    aria-label={`Swap ${ex.exercise_name}`}
                    title="Swap exercise"
                    className="rounded-lg p-2 text-text-muted transition-all hover:bg-raised hover:text-accent"
                  >
                    <ArrowLeftRight className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(ex)}
                    aria-label={`Remove ${ex.exercise_name}`}
                    title="Remove exercise"
                    className="rounded-lg p-2 text-text-muted transition-all hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <ExerciseNotes
              value={notesFor(ex)}
              status={noteStatus[ex.exercise_id]}
              onChange={(text) => changeNotes(ex, text)}
              onSave={() => saveNotes(ex, notesFor(ex))}
            />

            <div className="p-3">
              <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.75rem] gap-2 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                <span className="text-center">Set</span>
                <span>Previous</span>
                <span className="text-center">kg</span>
                <span className="text-center">Reps</span>
                <span />
              </div>
              {ex.sets.map((set) => (
                <React.Fragment key={set.id}>
                  <SetRow
                    set={set}
                    locked={isDone}
                    label={set.set_type === 'warmup' ? 'W' : set.set_number}
                    previous={prevFor(set)}
                    values={valuesFor(set)}
                    placeholders={placeholdersFor(set)}
                    canLog={isActive}
                    onChange={(field, value) => handleInput(set, field, value)}
                    onToggle={() => handleToggle(set)}
                  />
                  {draft.rest?.setId === set.id && set.completed && (
                    <RestTimer
                      key={draft.rest.endsAt}
                      endsAt={draft.rest.endsAt}
                      total={draft.rest.total}
                      onAdjust={(delta) =>
                        setDraft((d) => ({
                          ...d,
                          rest: {
                            ...d.rest,
                            endsAt: d.rest.endsAt + delta * 1000,
                            total: Math.max(d.rest.total, Math.ceil((d.rest.endsAt + delta * 1000 - Date.now()) / 1000)),
                          },
                        }))
                      }
                      onDone={() => setDraft((d) => ({ ...d, rest: null }))}
                    />
                  )}
                </React.Fragment>
              ))}
              {!isDone && (
                <div className="mt-2 flex gap-2 px-2">
                  <button
                    type="button"
                    onClick={() => addSet(ex, 'working')}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-raised hover:text-text"
                  >
                    <Plus className="h-3.5 w-3.5" />Set
                  </button>
                  <button
                    type="button"
                    onClick={() => addSet(ex, 'warmup')}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/15"
                  >
                    <Flame className="h-3.5 w-3.5" />Warm-up
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {!isDone && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-text-muted transition-colors hover:border-accent/60 hover:text-accent"
          >
            <Plus className="h-4 w-4" /> Add exercise
          </button>
        )}

        {isActive && (
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={requestFinish} loading={busy} className="w-full md:w-auto">
              Finish Workout
            </Button>
          </div>
        )}
      </main>

      <SwapModal
        isOpen={Boolean(swapTarget)}
        onClose={() => setSwapTarget(null)}
        exercise={swapTarget}
        catalog={catalog}
        workoutExerciseIds={workoutExerciseIds}
        onSelect={handleSwap}
      />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add exercise">
        <ExercisePicker catalog={catalog} excludeIds={workoutExerciseIds} actionLabel="Add" onPick={handleAddExercise} />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        tone="danger"
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.exercise_name}?`}
        message={
          removeTarget?.sets.some((s) => s.completed)
            ? 'Sets you already logged for this exercise will be deleted too.'
            : 'All planned sets for this exercise will be removed from this workout.'
        }
        actions={[
          { label: 'Remove exercise', variant: 'danger', onClick: handleRemoveExercise },
          { label: 'Cancel', variant: 'ghost', onClick: () => setRemoveTarget(null) },
        ]}
      />

      <ConfirmDialog
        isOpen={dialog === 'exit'}
        onClose={() => setDialog(null)}
        title="Leave this workout?"
        message="Your workout is still running. What would you like to do?"
        actions={[
          { label: 'Leave screen (keep workout running)', variant: 'primary', onClick: () => navigate('/dashboard') },
          { label: 'Finish workout', variant: 'ghost', onClick: () => { setDialog(null); requestFinish(); } },
          { label: 'Stop & discard workout', variant: 'danger', onClick: () => setDialog('discard') },
          { label: 'Cancel', variant: 'ghost', onClick: () => setDialog(null) },
        ]}
      />

      <ConfirmDialog
        isOpen={dialog === 'discard'}
        tone="danger"
        onClose={() => setDialog(null)}
        title="Discard this workout?"
        message="All sets you've logged in this session will be cleared and the timer reset. The workout goes back to your schedule."
        actions={[
          { label: 'Discard workout', variant: 'danger', onClick: discard },
          { label: 'Keep training', variant: 'ghost', onClick: () => setDialog(null) },
        ]}
      />

      <ConfirmDialog
        isOpen={dialog === 'finish'}
        onClose={() => setDialog(null)}
        title="Finish with sets remaining?"
        message={`${stats.total - stats.done} set${stats.total - stats.done === 1 ? '' : 's'} not logged yet. You can still finish and save what you've done.`}
        actions={[
          { label: 'Finish workout', variant: 'primary', onClick: finish },
          { label: 'Keep training', variant: 'ghost', onClick: () => setDialog(null) },
        ]}
      />
    </div>
  );
};

export default WorkoutPage;
