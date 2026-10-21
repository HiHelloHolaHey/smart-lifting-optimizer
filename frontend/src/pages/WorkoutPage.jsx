import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, TrendingUp, Sparkles, Plus, Flame } from 'lucide-react';
import { workouts as workoutsApi, ai } from '../api/endpoints';
import { useProgressOverload } from '../hooks/useProgressOverload';
import { usePersistentState } from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import SetRow from '../components/workout/SetRow';
import RestTimer from '../components/workout/RestTimer';
import ExerciseNotes from '../components/workout/ExerciseNotes';
import SmartSwapModal from '../components/workout/SmartSwapModal';

const REST_SECONDS = { working: 120, warmup: 60 };

const OverloadChip = ({ exerciseId }) => {
  const { suggestion, loading } = useProgressOverload(exerciseId);
  if (loading || !suggestion || suggestion.suggested_weight_kg === undefined) return null;
  return (
    <div
      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300"
      title={suggestion.increment_reason}
    >
      <TrendingUp className="h-3.5 w-3.5" />
      Suggested: {suggestion.suggested_weight_kg}kg × {suggestion.suggested_reps}
      {suggestion.source === 'ai' && <Sparkles className="h-3 w-3 text-cyan-300" aria-label="AI-adjusted" />}
    </div>
  );
};

/** 2-sentence AI coaching brief; cached per workout so refreshes don't re-bill the LLM. */
const CoachBrief = ({ workoutId }) => {
  const [brief, setBrief] = usePersistentState(`brief-${workoutId}`, null);
  const [loading, setLoading] = useState(!brief);

  useEffect(() => {
    if (brief) return;
    let alive = true;
    ai.preWorkoutBrief(workoutId)
      .then(({ data }) => alive && setBrief({ text: data.brief, source: data.source }))
      .catch(() => alive && setBrief(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [workoutId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !brief) return null;
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-indigo-500/10 p-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
        <Sparkles className="h-4 w-4" />
        {brief?.source === 'ai' ? 'AI Coach' : 'Coach'}
      </div>
      {loading ? (
        <div className="space-y-2" aria-busy="true"><div className="h-3 w-full animate-pulse rounded bg-slate-700/60" /><div className="h-3 w-2/3 animate-pulse rounded bg-slate-700/60" /></div>
      ) : (
        <p className="text-sm leading-relaxed text-slate-200">{brief.text}</p>
      )}
    </div>
  );
};

const WorkoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);

  // Everything the user types lives in a localStorage-backed draft, so an accidental refresh loses nothing.
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

  const previousMap = useMemo(() => {
    const m = {};
    (workout?.previous || []).forEach((p) => { m[`${p.exercise_id}-${p.set_type}-${p.set_number}`] = p; });
    return m;
  }, [workout?.previous]);

  const exercises = useMemo(() => {
    if (!workout) return [];
    const map = new Map();
    workout.sets.forEach((s) => {
      if (!map.has(s.exercise_id)) map.set(s.exercise_id, { exercise_id: s.exercise_id, exercise_name: s.exercise_name, muscle_group: s.muscle_group, sets: [] });
      map.get(s.exercise_id).sets.push(s);
    });
    map.forEach((ex) => ex.sets.sort((a, b) => (a.set_type === b.set_type ? a.set_number - b.set_number : a.set_type === 'warmup' ? -1 : 1)));
    return [...map.values()];
  }, [workout]);

  const valuesFor = (set) => draft.inputs[set.id] ?? { weight: set.weight_kg ?? '', reps: set.reps ?? '' };
  const notesFor = (ex) => draft.notes[ex.exercise_id] ?? workout.notes_by_exercise?.[ex.exercise_id] ?? '';

  const patchSet = (setId, patch) =>
    setWorkout((w) => ({ ...w, sets: w.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }));

  const handleInput = (set, field, value) =>
    setDraft((d) => ({ ...d, inputs: { ...d.inputs, [set.id]: { ...valuesFor(set), [field]: value } } }));

  const handleToggle = async (set) => {
    const nowDone = !set.completed;
    const prev = previousMap[`${set.exercise_id}-${set.set_type}-${set.set_number}`];
    const v = valuesFor(set);
    // Empty inputs fall back to the ghost/previous values so one tap logs "same as last time"
    const weight = v.weight !== '' ? Number(v.weight) : prev ? Number(prev.weight_kg) : Number(set.weight_kg ?? 0);
    const reps = v.reps !== '' ? parseInt(v.reps, 10) : prev ? prev.reps : Number(set.reps ?? 0);

    setError('');
    patchSet(set.id, { completed: nowDone, weight_kg: weight, reps });
    setDraft((d) => ({
      ...d,
      inputs: { ...d.inputs, [set.id]: { weight, reps } },
      rest: nowDone ? { setId: set.id, endsAt: Date.now() + REST_SECONDS[set.set_type] * 1000, total: REST_SECONDS[set.set_type] } : d.rest?.setId === set.id ? null : d.rest,
    }));

    try {
      await workoutsApi.updateSet(id, set.id, { weight_kg: weight, reps, completed: nowDone });
      if (nowDone && workout.status === 'scheduled') {
        setWorkout((w) => ({ ...w, status: 'active' }));
        workoutsApi.updateStatus(id, 'active').catch(() => {});
      }
    } catch {
      patchSet(set.id, { completed: set.completed });
      setDraft((d) => ({ ...d, rest: null }));
      setError('Could not save that set. Your numbers are kept — try again.');
    }
  };

  const saveNotes = async (ex) => {
    try { await workoutsApi.saveNotes(id, ex.exercise_id, notesFor(ex)); }
    catch { setError('Could not save notes. They are kept locally.'); }
  };

  const addSet = async (ex, setType) => {
    try {
      const last = [...ex.sets].reverse().find((s) => s.set_type === setType) || ex.sets[ex.sets.length - 1];
      const { data } = await workoutsApi.addSet(id, {
        exercise_id: ex.exercise_id, set_type: setType,
        weight_kg: setType === 'warmup' ? null : last?.weight_kg ?? null, reps: last?.reps ?? null,
      });
      setWorkout((w) => ({ ...w, sets: [...w.sets, { ...data, exercise_name: ex.exercise_name, muscle_group: ex.muscle_group }] }));
    } catch {
      setError('Could not add set.');
    }
  };

  const handleSwap = async (alt) => {
    try {
      await workoutsApi.swapExercise(id, swapTarget.exercise_id, alt.id);
      setSwapTarget(null);
      await load();
    } catch {
      setError('Swap failed. Please try again.');
    }
  };

  const finish = async () => {
    try {
      await workoutsApi.updateStatus(id, 'completed');
      clearDraft();
      localStorage.removeItem(`brief-${id}`);
      setFinished(true);
      setTimeout(() => navigate('/dashboard'), 2200);
    } catch {
      setError('Could not complete workout. Please retry.');
    }
  };

  const stats = useMemo(() => {
    const done = (workout?.sets || []).filter((s) => s.completed && s.set_type === 'working');
    return { sets: done.length, volume: Math.round(done.reduce((a, s) => a + Number(s.weight_kg || 0) * (s.reps || 0), 0)) };
  }, [workout]);

  if (loadError) return <div className="p-10 text-center text-slate-400">{loadError}</div>;
  if (!workout) return <LoadingSpinner />;

  return (
    <div className="relative min-h-screen bg-slate-950 pb-24 text-slate-100">
      {finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="space-y-3 text-center">
            <div className="animate-bounce text-6xl">🎉</div>
            <h2 className="bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent">Workout Complete!</h2>
            <p className="text-slate-400">{stats.sets} sets · {stats.volume.toLocaleString()} kg volume</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 p-4 backdrop-blur-md lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Back" onClick={() => navigate('/dashboard')} className="-ml-2 rounded-lg p-2 text-slate-400 hover:text-slate-100">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{workout.split_type.replace('_', ' ')}</h1>
              <p className="text-xs text-slate-400">{new Date(workout.scheduled_date).toLocaleDateString()} · {stats.sets} sets · {stats.volume.toLocaleString()} kg</p>
            </div>
          </div>
          <Badge variant={workout.status === 'completed' ? 'success' : workout.status === 'active' ? 'warning' : 'info'}>{workout.status}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 p-4 lg:p-8">
        {workout.status !== 'completed' && <CoachBrief workoutId={id} />}
        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        {exercises.map((ex) => (
          <Card key={ex.exercise_id} className="overflow-hidden !p-0 border-slate-800">
            <div className="flex items-start justify-between border-b border-slate-800 bg-slate-900/40 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{ex.exercise_name}</h3>
                  <Badge variant="default">{ex.muscle_group}</Badge>
                </div>
                <OverloadChip exerciseId={ex.exercise_id} />
              </div>
              <button type="button" onClick={() => setSwapTarget(ex)} aria-label={`Swap ${ex.exercise_name}`} title="Swap exercise"
                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-indigo-500/10 hover:text-indigo-300">
                <ArrowLeftRight className="h-5 w-5" />
              </button>
            </div>

            <ExerciseNotes
              value={notesFor(ex)}
              onChange={(text) => setDraft((d) => ({ ...d, notes: { ...d.notes, [ex.exercise_id]: text } }))}
              onSave={() => saveNotes(ex)}
            />

            <div className="p-3">
              <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.75rem] gap-2 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span className="text-center">Set</span><span>Previous</span><span className="text-center">kg</span><span className="text-center">Reps</span><span />
              </div>
              {ex.sets.map((set) => (
                <React.Fragment key={set.id}>
                  <SetRow
                    set={set}
                    label={set.set_type === 'warmup' ? 'W' : set.set_number}
                    previous={previousMap[`${set.exercise_id}-${set.set_type}-${set.set_number}`]}
                    values={valuesFor(set)}
                    onChange={(field, value) => handleInput(set, field, value)}
                    onToggle={() => handleToggle(set)}
                  />
                  {draft.rest?.setId === set.id && set.completed && (
                    <RestTimer
                      key={draft.rest.endsAt}
                      endsAt={draft.rest.endsAt}
                      total={draft.rest.total}
                      onAdjust={(delta) => setDraft((d) => ({ ...d, rest: { ...d.rest, endsAt: d.rest.endsAt + delta * 1000, total: Math.max(d.rest.total, Math.ceil((d.rest.endsAt + delta * 1000 - Date.now()) / 1000)) } }))}
                      onDone={() => setDraft((d) => ({ ...d, rest: null }))}
                    />
                  )}
                </React.Fragment>
              ))}
              <div className="mt-2 flex gap-2 px-2">
                <button type="button" onClick={() => addSet(ex, 'working')} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100"><Plus className="h-3.5 w-3.5" />Set</button>
                <button type="button" onClick={() => addSet(ex, 'warmup')} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-400/80 hover:bg-amber-500/10"><Flame className="h-3.5 w-3.5" />Warm-up</button>
              </div>
            </div>
          </Card>
        ))}

        {workout.status !== 'completed' && (
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={finish} className="w-full md:w-auto shadow-[0_0_20px_rgba(99,102,241,0.25)]">Complete Workout</Button>
          </div>
        )}
      </main>

      <SmartSwapModal isOpen={Boolean(swapTarget)} onClose={() => setSwapTarget(null)} exercise={swapTarget} onSelect={handleSwap} />
    </div>
  );
};

export default WorkoutPage;
