import React, { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, ChevronUp, ChevronDown, X, Plus, Wand2, Loader2, Save, Play, Trash2, Pencil, Search } from 'lucide-react';
import { templates as templatesApi, exerciseCatalog, ai } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { usePersistentState } from '../hooks/usePersistentState';

const EMPTY = { id: null, name: '', exercises: [] };

let uidCounter = 1;
const makeUid = () => `tpl-ex-${Date.now()}-${uidCounter++}`;
const ensureUid = (ex) => (ex._uid ? ex : { ...ex, _uid: makeUid() });

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [saved, setSaved] = useState([]);
  const [draft, setDraft, clearDraft] = usePersistentState('template-builder-draft', EMPTY);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [movedUid, setMovedUid] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type, text}

  // FLIP animation tracking for smooth reordering
  const rowRefs = useRef(new Map());
  const prevPositions = useRef(new Map());

  const capturePositions = () => {
    const map = new Map();
    rowRefs.current.forEach((node, uid) => {
      if (node) map.set(uid, node.getBoundingClientRect().top);
    });
    prevPositions.current = map;
  };

  useLayoutEffect(() => {
    if (prevPositions.current.size === 0) return;
    rowRefs.current.forEach((node, uid) => {
      const prevTop = prevPositions.current.get(uid);
      if (!node || prevTop === undefined) return;
      const nextTop = node.getBoundingClientRect().top;
      const deltaY = prevTop - nextTop;
      if (Math.abs(deltaY) > 1) {
        node.style.transition = 'none';
        node.style.transform = `translateY(${deltaY}px)`;
        requestAnimationFrame(() => {
          if (!node) return;
          node.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';
          node.style.transform = 'translateY(0)';
        });
      }
    });
    prevPositions.current = new Map();
  }, [draft.exercises]);

  const refresh = useCallback(() => templatesApi.list().then(({ data }) => setSaved(data)).catch(() => {}), []);

  useEffect(() => {
    exerciseCatalog.list().then(({ data }) => setCatalog(data)).catch(() => setMsg({ type: 'error', text: 'Could not load exercises.' }));
    refresh();
  }, [refresh]);

  // Backfill _uid on any persisted draft items from older sessions
  useEffect(() => {
    if (draft.exercises.some((e) => !e._uid)) {
      setDraft((d) => ({ ...d, exercises: d.exercises.map(ensureUid) }));
    }
  }, [draft.exercises, setDraft]);

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const groups = useMemo(() => ['all', ...new Set(catalog.map((c) => c.muscle_group))], [catalog]);
  const filtered = useMemo(
    () => catalog.filter((c) => (group === 'all' || c.muscle_group === group) && c.name.toLowerCase().includes(search.toLowerCase())),
    [catalog, group, search]
  );

  const setExercises = (fn) => setDraft((d) => ({ ...d, exercises: fn(d.exercises) }));
  const addExercise = (c) =>
    setExercises((list) => [
      ...list,
      { _uid: makeUid(), exercise_id: c.id, sets: 3, rep_min: 8, rep_max: 12, weight_kg: '' },
    ]);
  const removeAt = (i) => {
    capturePositions();
    setExercises((list) => list.filter((_, idx) => idx !== i));
  };
  const patchAt = (i, patch) => setExercises((list) => list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const move = (from, to) => {
    if (to < 0 || to >= draft.exercises.length || from === to) return;
    capturePositions();
    const movedItem = draft.exercises[from];
    if (movedItem?._uid) {
      setMovedUid(movedItem._uid);
      setTimeout(() => setMovedUid((cur) => (cur === movedItem._uid ? null : cur)), 450);
    }
    setExercises((list) => {
      if (to < 0 || to >= list.length || from === to) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const onDrop = (to) => {
    if (dragIndex !== null) move(dragIndex, to);
    setDragIndex(null);
    setOverIndex(null);
  };

  const serializeExercise = ({ exercise_id, sets, rep_min, rep_max, weight_kg }) => {
    const parsedWeight = weight_kg !== '' && weight_kg != null && Number(weight_kg) > 0 ? Number(weight_kg) : null;
    return {
      exercise_id,
      sets: Number(sets) || 3,
      rep_min: Number(rep_min) || 8,
      rep_max: Number(rep_max) || 12,
      ...(parsedWeight !== null ? { weight_kg: parsedWeight } : {}),
    };
  };

  const save = async () => {
    setMsg(null);
    if (!draft.name.trim()) return setMsg({ type: 'error', text: 'Give your split a name.' });
    if (draft.exercises.length === 0) return setMsg({ type: 'error', text: 'Add at least one exercise.' });
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        exercises: draft.exercises.map(serializeExercise),
      };
      if (draft.id) await templatesApi.update(draft.id, payload);
      else await templatesApi.create(payload);
      setMsg({ type: 'ok', text: draft.id ? 'Template updated.' : 'Template saved.' });
      setDraft(EMPTY);
      clearDraft();
      refresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Save failed.' });
    } finally {
      setBusy(false);
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    if (aiPrompt.trim().length < 3) return;
    setAiLoading(true);
    setMsg(null);
    try {
      const { data } = await ai.generateRoutine(aiPrompt.trim());
      setDraft({
        id: null,
        name: data.name,
        exercises: data.exercises.map(({ exercise_id, sets, rep_min, rep_max, weight_kg }) => ({
          _uid: makeUid(),
          exercise_id,
          sets,
          rep_min,
          rep_max,
          weight_kg: weight_kg != null && Number(weight_kg) > 0 ? String(weight_kg) : '',
        })),
      });
      setMsg({
        type: 'ok',
        text: data.source === 'ai' ? 'AI built a routine — tweak and save it.' : 'AI unavailable — built a basic routine instead. Tweak and save it.',
      });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Could not generate routine.' });
    } finally {
      setAiLoading(false);
    }
  };

  const startTemplate = async (t) => {
    try {
      const { data } = await templatesApi.start(t.id);
      navigate(`/workout/${data.workout_id}`);
    } catch {
      setMsg({ type: 'error', text: 'Could not start workout.' });
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await templatesApi.remove(id).catch(() => {});
    if (draft.id === id) {
      setDraft(EMPTY);
      clearDraft();
    }
    refresh();
  };

  const editTemplate = (t) => {
    setDraft({
      id: t.id,
      name: t.name,
      exercises: t.exercise_order_json.map(({ exercise_id, sets, rep_min, rep_max, weight_kg }) => ({
        _uid: makeUid(),
        exercise_id,
        sets,
        rep_min,
        rep_max,
        weight_kg: weight_kg != null && Number(weight_kg) > 0 ? String(weight_kg) : '',
      })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const numInput =
    'h-9 w-14 rounded-lg border border-slate-700 bg-slate-900 px-2 text-center text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40';

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Template Builder</h1>
        <p className="mt-1 text-slate-400">Create custom splits, set optional target weights, and reorder exercises.</p>
      </header>

      {msg && (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            msg.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={generate} className="mb-6 flex flex-col gap-2 rounded-2xl border border-ai/25 bg-ai-tint p-3 sm:flex-row">
        <input
          className="input-field flex-1"
          maxLength={500}
          placeholder='Describe a workout, e.g. "I only have dumbbells and 45 minutes"'
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button type="submit" disabled={aiLoading} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate with AI
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Picker */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-100">Exercise Catalog</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="input-field !pl-9" placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  group === g ? 'bg-accent text-on-accent' : 'bg-raised text-text-muted hover:text-text'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <ul className="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => addExercise(c)}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-800"
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-100">{c.name}</span>
                    <span className="text-xs text-slate-500">
                      {c.muscle_group} · {(c.equipment_needed || []).join(', ')}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-indigo-400" />
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No matching exercises</li>}
          </ul>
        </Card>

        {/* Builder */}
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <input
              className="input-field flex-1 !text-lg !font-semibold"
              maxLength={60}
              placeholder="Split name (e.g. Push Day)"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            {(draft.id || draft.exercises.length > 0 || draft.name) && (
              <button
                type="button"
                onClick={() => {
                  setDraft(EMPTY);
                  clearDraft();
                }}
                className="btn-ghost !px-3 text-sm"
                title="Clear builder"
              >
                Clear
              </button>
            )}
          </div>

          {draft.exercises.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
              Pick exercises from the catalog on the left to start building your routine.
            </div>
          ) : (
            <ol className="space-y-2.5">
              {draft.exercises.map((ex, i) => {
                const info = byId.get(ex.exercise_id);
                const uid = ex._uid || `${ex.exercise_id}-${i}`;
                const isJustMoved = movedUid === uid;
                return (
                  <li
                    key={uid}
                    ref={(el) => {
                      if (el) rowRefs.current.set(uid, el);
                      else rowRefs.current.delete(uid);
                    }}
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(i);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      onDrop(i);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-900/70 p-3 transition-colors duration-200 ${
                      dragIndex === i ? 'opacity-40' : ''
                    } ${
                      overIndex === i && dragIndex !== null && dragIndex !== i
                        ? 'border-indigo-400 shadow-[0_0_0_1px_rgba(99,102,241,0.6)]'
                        : isJustMoved
                        ? 'border-indigo-500/80 bg-indigo-500/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex min-w-[10rem] flex-1 items-center gap-2.5">
                      <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-slate-600 active:cursor-grabbing" aria-hidden />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">{info?.name || `Exercise #${ex.exercise_id}`}</div>
                        {info && <Badge variant="default">{info.muscle_group}</Badge>}
                      </div>
                    </div>

                    {/* Aligned Sets / Weight (kg) / Reps controls */}
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sets</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          aria-label="Sets"
                          className={numInput}
                          value={ex.sets}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => patchAt(i, { sets: Math.max(1, Math.min(10, +e.target.value || 1)) })}
                        />
                      </label>

                      <label className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Kg (opt)</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          step="0.5"
                          placeholder="—"
                          aria-label="Default weight in kg (optional)"
                          className={`${numInput} !w-16`}
                          value={ex.weight_kg ?? ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => patchAt(i, { weight_kg: e.target.value })}
                        />
                      </label>

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Reps</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            aria-label="Minimum reps"
                            className={numInput}
                            value={ex.rep_min}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = Math.max(1, Math.min(50, +e.target.value || 1));
                              patchAt(i, { rep_min: v, rep_max: Math.max(v, ex.rep_max) });
                            }}
                          />
                          <span className="text-slate-600">–</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            aria-label="Maximum reps"
                            className={numInput}
                            value={ex.rep_max}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => patchAt(i, { rep_max: Math.max(ex.rep_min, Math.min(50, +e.target.value || ex.rep_min)) })}
                          />
                        </div>
                      </div>

                      <div className="flex h-9 items-center">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={i === 0}
                          onClick={() => move(i, i - 1)}
                          className="rounded p-1 text-slate-500 transition-colors hover:text-slate-100 disabled:opacity-30"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={i === draft.exercises.length - 1}
                          onClick={() => move(i, i + 1)}
                          className="rounded p-1 text-slate-500 transition-colors hover:text-slate-100 disabled:opacity-30"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove exercise"
                          onClick={() => removeAt(i)}
                          className="rounded p-1 text-slate-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={save} disabled={busy} className="btn-primary flex items-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {draft.id ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </Card>
      </div>

      {/* Saved */}
      <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-100">Your Templates</h2>
      {saved.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing saved yet. Build a template above to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((t) => (
            <Card key={t.id} className="flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-slate-100">{t.name}</h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${t.name}`}
                      onClick={() => editTemplate(t)}
                      className="rounded p-1.5 text-slate-500 transition-colors hover:text-indigo-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => setDeleteTarget(t)}
                      className="rounded p-1.5 text-slate-500 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <ul className="mb-4 space-y-1 text-xs text-slate-400">
                  {t.exercise_order_json.slice(0, 5).map((e, i) => (
                    <li key={i}>
                      {e.name} · {e.sets}×{e.rep_min}-{e.rep_max}
                      {e.weight_kg != null && Number(e.weight_kg) > 0 ? ` @ ${Number(e.weight_kg)}kg` : ''}
                    </li>
                  ))}
                  {t.exercise_order_json.length > 5 && <li>+{t.exercise_order_json.length - 5} more</li>}
                </ul>
              </div>
              <button type="button" onClick={() => startTemplate(t)} className="btn-ghost flex w-full items-center justify-center gap-2">
                <Play className="h-4 w-4" /> Start workout
              </button>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name || 'template'}"?`}
        message="This will permanently delete this template. Any workouts already created from it will not be affected."
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        actions={[
          { label: 'Delete template', variant: 'danger', onClick: confirmDeleteTemplate },
          { label: 'Cancel', variant: 'ghost', onClick: () => setDeleteTarget(null) },
        ]}
      />
    </div>
  );
};

export default TemplatesPage;
