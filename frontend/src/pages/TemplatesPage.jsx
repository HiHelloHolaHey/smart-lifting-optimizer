import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GripVertical, ChevronUp, ChevronDown, X, Plus, Wand2, Loader2, Save, Play, Trash2, Pencil, Search } from 'lucide-react';
import { templates as templatesApi, exerciseCatalog, ai } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { usePersistentState } from '../hooks/usePersistentState';

const EMPTY = { id: null, name: '', exercises: [] };

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [saved, setSaved] = useState([]);
  const [draft, setDraft, clearDraft] = usePersistentState('template-builder-draft', EMPTY);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type, text}

  const refresh = useCallback(() => templatesApi.list().then(({ data }) => setSaved(data)).catch(() => {}), []);

  useEffect(() => {
    exerciseCatalog.list().then(({ data }) => setCatalog(data)).catch(() => setMsg({ type: 'error', text: 'Could not load exercises.' }));
    refresh();
  }, [refresh]);

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const groups = useMemo(() => ['all', ...new Set(catalog.map((c) => c.muscle_group))], [catalog]);
  const filtered = useMemo(
    () => catalog.filter((c) => (group === 'all' || c.muscle_group === group) && c.name.toLowerCase().includes(search.toLowerCase())),
    [catalog, group, search]
  );

  const setExercises = (fn) => setDraft((d) => ({ ...d, exercises: fn(d.exercises) }));
  const addExercise = (c) => setExercises((list) => [...list, { exercise_id: c.id, sets: 3, rep_min: 8, rep_max: 12 }]);
  const removeAt = (i) => setExercises((list) => list.filter((_, idx) => idx !== i));
  const patchAt = (i, patch) => setExercises((list) => list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const move = (from, to) =>
    setExercises((list) => {
      if (to < 0 || to >= list.length || from === to) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const onDrop = (to) => {
    if (dragIndex !== null) move(dragIndex, to);
    setDragIndex(null);
    setOverIndex(null);
  };

  const save = async () => {
    setMsg(null);
    if (!draft.name.trim()) return setMsg({ type: 'error', text: 'Give your split a name.' });
    if (draft.exercises.length === 0) return setMsg({ type: 'error', text: 'Add at least one exercise.' });
    setBusy(true);
    try {
      const payload = { name: draft.name.trim(), exercises: draft.exercises };
      if (draft.id) await templatesApi.update(draft.id, payload);
      else await templatesApi.create(payload);
      setMsg({ type: 'ok', text: 'Template saved.' });
      setDraft(EMPTY); clearDraft();
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
    setAiLoading(true); setMsg(null);
    try {
      const { data } = await ai.generateRoutine(aiPrompt.trim());
      setDraft({ id: null, name: data.name, exercises: data.exercises.map(({ exercise_id, sets, rep_min, rep_max }) => ({ exercise_id, sets, rep_min, rep_max })) });
      setMsg({ type: 'ok', text: data.source === 'ai' ? 'AI built a routine — tweak and save it.' : 'AI unavailable — built a basic routine instead. Tweak and save it.' });
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
    } catch { setMsg({ type: 'error', text: 'Could not start workout.' }); }
  };
  const removeTemplate = async (t) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    await templatesApi.remove(t.id).catch(() => {});
    refresh();
  };
  const editTemplate = (t) =>
    setDraft({ id: t.id, name: t.name, exercises: t.exercise_order_json.map(({ exercise_id, sets, rep_min, rep_max }) => ({ exercise_id, sets, rep_min, rep_max })) });

  const numInput = 'w-14 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-center text-sm text-slate-100 focus:border-indigo-500 focus:outline-none';

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center gap-3">
          <button type="button" aria-label="Back to dashboard" onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-slate-400 hover:text-slate-100"><ArrowLeft className="h-6 w-6" /></button>
          <div>
            <h1 className="text-2xl font-bold">Template Builder</h1>
            <p className="text-sm text-slate-400">Create custom splits — drag to reorder.</p>
          </div>
        </header>

        {msg && (
          <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>{msg.text}</div>
        )}

        <form onSubmit={generate} className="mb-6 flex flex-col gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3 sm:flex-row">
          <input className="input-field flex-1" maxLength={500} placeholder='Describe a workout, e.g. "I only have dumbbells and 45 minutes"' value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
          <button type="submit" disabled={aiLoading} className="btn-primary flex items-center justify-center gap-2">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate with AI
          </button>
        </form>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Picker */}
          <Card className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">Exercises</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input className="input-field !pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <button key={g} type="button" onClick={() => setGroup(g)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${group === g ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>{g}</button>
              ))}
            </div>
            <ul className="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => addExercise(c)} className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-800">
                    <span><span className="block text-sm font-medium">{c.name}</span><span className="text-xs text-slate-500">{c.muscle_group} · {(c.equipment_needed || []).join(', ')}</span></span>
                    <Plus className="h-4 w-4 text-slate-600 group-hover:text-indigo-400" />
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No matches</li>}
            </ul>
          </Card>

          {/* Builder */}
          <Card className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <input className="input-field flex-1 !text-lg !font-semibold" maxLength={60} placeholder="Split name (e.g. Push Day)" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              {(draft.id || draft.exercises.length > 0 || draft.name) && (
                <button type="button" onClick={() => { setDraft(EMPTY); clearDraft(); }} className="btn-ghost !px-3" title="Clear">Clear</button>
              )}
            </div>

            {draft.exercises.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">Pick exercises from the list to start building.</div>
            ) : (
              <ol className="space-y-2">
                {draft.exercises.map((ex, i) => {
                  const info = byId.get(ex.exercise_id);
                  return (
                    <li
                      key={`${ex.exercise_id}-${i}`}
                      draggable
                      onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                      onDrop={(e) => { e.preventDefault(); onDrop(i); }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border bg-slate-900/70 p-3 transition-all ${dragIndex === i ? 'opacity-40' : ''} ${overIndex === i && dragIndex !== null && dragIndex !== i ? 'border-indigo-400 shadow-[0_0_0_1px_rgba(99,102,241,0.6)]' : 'border-slate-800'}`}
                    >
                      <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-slate-600 active:cursor-grabbing" aria-hidden />
                      <div className="min-w-[8rem] flex-1">
                        <div className="text-sm font-semibold">{info?.name || `Exercise #${ex.exercise_id}`}</div>
                        {info && <Badge variant="default">{info.muscle_group}</Badge>}
                      </div>
                      <label className="text-center text-[10px] uppercase text-slate-500">Sets<input type="number" min="1" max="10" className={numInput} value={ex.sets} onChange={(e) => patchAt(i, { sets: Math.max(1, Math.min(10, +e.target.value || 1)) })} /></label>
                      <label className="text-center text-[10px] uppercase text-slate-500">Reps
                        <span className="flex items-center gap-1">
                          <input type="number" min="1" max="50" aria-label="Minimum reps" className={numInput} value={ex.rep_min} onChange={(e) => { const v = Math.max(1, Math.min(50, +e.target.value || 1)); patchAt(i, { rep_min: v, rep_max: Math.max(v, ex.rep_max) }); }} />
                          <span className="text-slate-600">–</span>
                          <input type="number" min="1" max="50" aria-label="Maximum reps" className={numInput} value={ex.rep_max} onChange={(e) => patchAt(i, { rep_max: Math.max(ex.rep_min, Math.min(50, +e.target.value || ex.rep_min)) })} />
                        </span>
                      </label>
                      <div className="flex">
                        <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded p-1 text-slate-500 hover:text-slate-100 disabled:opacity-30"><ChevronUp className="h-5 w-5" /></button>
                        <button type="button" aria-label="Move down" disabled={i === draft.exercises.length - 1} onClick={() => move(i, i + 1)} className="rounded p-1 text-slate-500 hover:text-slate-100 disabled:opacity-30"><ChevronDown className="h-5 w-5" /></button>
                        <button type="button" aria-label="Remove" onClick={() => removeAt(i)} className="rounded p-1 text-slate-500 hover:text-red-400"><X className="h-5 w-5" /></button>
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
        <h2 className="mb-3 mt-10 text-lg font-semibold">Your Templates</h2>
        {saved.length === 0 ? <p className="text-sm text-slate-500">Nothing saved yet.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((t) => (
              <Card key={t.id}>
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Edit" onClick={() => editTemplate(t)} className="rounded p-1.5 text-slate-500 hover:text-indigo-300"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label="Delete" onClick={() => removeTemplate(t)} className="rounded p-1.5 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <ul className="mb-4 space-y-0.5 text-xs text-slate-400">
                  {t.exercise_order_json.slice(0, 5).map((e, i) => <li key={i}>{e.name} · {e.sets}×{e.rep_min}-{e.rep_max}</li>)}
                  {t.exercise_order_json.length > 5 && <li>+{t.exercise_order_json.length - 5} more</li>}
                </ul>
                <button type="button" onClick={() => startTemplate(t)} className="btn-ghost flex w-full items-center justify-center gap-2"><Play className="h-4 w-4" /> Start workout</button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
