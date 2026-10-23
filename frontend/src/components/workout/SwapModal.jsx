import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Wand2, Hand } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import ExercisePicker from './ExercisePicker';
import { ai } from '../../api/endpoints';

/** Swap an exercise either manually (pick anything) or with AI "Smart Swap" (reason -> 2 equivalents). */
const SwapModal = ({ isOpen, onClose, exercise, catalog, workoutExerciseIds, onSelect }) => {
  const [tab, setTab] = useState('smart');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setTab('smart'); setReason(''); setResult(null); setError(''); }
  }, [isOpen, exercise?.exercise_id]);

  const search = async (e) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await ai.smartSwap(exercise.exercise_id, reason.trim());
      setResult({ ...data, alternatives: data.alternatives.filter((a) => !workoutExerciseIds.includes(a.id)) });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch alternatives.');
    } finally {
      setLoading(false);
    }
  };

  const tabCls = (t) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      tab === t ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-text'
    }`;
  const muscle = catalog.find((c) => c.id === exercise?.exercise_id)?.muscle_group || exercise?.muscle_group || 'all';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Swap ${exercise?.exercise_name || 'exercise'}`}>
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-raised p-1" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'smart'} className={tabCls('smart')} onClick={() => setTab('smart')}>
          <Sparkles className="h-4 w-4" />Smart swap
        </button>
        <button type="button" role="tab" aria-selected={tab === 'manual'} className={tabCls('manual')} onClick={() => setTab('manual')}>
          <Hand className="h-4 w-4" />Choose manually
        </button>
      </div>

      {tab === 'smart' ? (
        <>
          <form onSubmit={search} className="mb-4 flex gap-2">
            <input
              className="input-field flex-1"
              maxLength={300}
              aria-label="Reason for swapping"
              placeholder="Why? e.g. lower back pain, rack is taken (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 !px-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}Find
            </button>
          </form>
          {error && <p className="mb-3 text-sm text-danger">{error}</p>}
          {result && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-ai/25 bg-ai-tint px-2.5 py-1 text-xs font-medium text-ai">
                <Sparkles className="h-3.5 w-3.5" />
                {result.source === 'ai' ? 'Picked by AI coach' : 'Rule-based picks (AI unavailable)'}
              </div>
              {result.alternatives.length === 0 && (
                <p className="text-sm text-text-muted">All suggestions are already in this workout. Try choosing manually.</p>
              )}
              {result.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelect(alt)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-border bg-raised p-4 text-left transition-colors hover:border-accent/60"
                >
                  <span className="font-medium text-text">{alt.name}</span>
                  {alt.rationale && <span className="text-sm text-text-muted">{alt.rationale}</span>}
                  <span className="flex flex-wrap gap-1.5">
                    {(alt.equipment_needed || []).map((eq) => (
                      <Badge key={eq} variant="default">
                        {eq}
                      </Badge>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!result && !loading && <p className="text-sm text-text-muted">Add a reason for smarter suggestions, or just press Find.</p>}
        </>
      ) : (
        <ExercisePicker catalog={catalog} excludeIds={[...workoutExerciseIds]} initialGroup={muscle} actionLabel="Swap" onPick={onSelect} />
      )}
    </Modal>
  );
};

export default SwapModal;
