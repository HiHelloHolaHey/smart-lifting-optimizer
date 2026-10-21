import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { ai } from '../../api/endpoints';

/** Smart Swap: optional reason ("lower back pain", "rack is taken") -> 2 AI-picked equivalents. */
const SmartSwapModal = ({ isOpen, onClose, exercise, onSelect }) => {
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setReason(''); setResult(null); setError(''); }
  }, [isOpen, exercise?.exercise_id]);

  const search = async (e) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await ai.smartSwap(exercise.exercise_id, reason.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch alternatives.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Swap ${exercise?.exercise_name || 'exercise'}`}>
      <form onSubmit={search} className="mb-4 flex gap-2">
        <input
          className="input-field flex-1" maxLength={300}
          placeholder="Why? e.g. lower back pain, rack is taken (optional)"
          value={reason} onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 !px-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Find
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            {result.source === 'ai' ? 'Picked by AI coach' : 'Rule-based picks (AI unavailable)'}
          </div>
          {result.alternatives.map((alt) => (
            <button
              key={alt.id} type="button" onClick={() => onSelect(alt)}
              className="flex w-full flex-col gap-2 rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-left transition-colors hover:border-indigo-500/60 hover:bg-slate-700/50"
            >
              <span className="font-semibold text-slate-100">{alt.name}</span>
              {alt.rationale && <span className="text-sm text-slate-400">{alt.rationale}</span>}
              <span className="flex flex-wrap gap-1.5">
                {(alt.equipment_needed || []).map((eq) => <Badge key={eq} variant="default">{eq}</Badge>)}
              </span>
            </button>
          ))}
        </div>
      )}
      {!result && !loading && <p className="text-sm text-slate-500">Add a reason for smarter suggestions, or just press Find.</p>}
    </Modal>
  );
};

export default SmartSwapModal;
