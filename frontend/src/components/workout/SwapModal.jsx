import React, { useEffect, useState } from 'react';
import { Sparkles, Wand2, Hand } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
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
    if (isOpen) {
      setTab('smart');
      setReason('');
      setResult(null);
      setError('');
    }
  }, [isOpen, exercise?.exercise_id]);

  const search = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await ai.smartSwap(exercise.exercise_id, reason.trim());
      setResult({ ...data, alternatives: data.alternatives.filter((a) => !workoutExerciseIds.includes(a.id)) });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch alternatives.');
    } finally {
      setLoading(false);
    }
  };

  const muscle = catalog.find((c) => c.id === exercise?.exercise_id)?.muscle_group || exercise?.muscle_group || 'all';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Swap ${exercise?.exercise_name || 'exercise'}`}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="smart">
            <Sparkles className="h-4 w-4" />
            Smart swap
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Hand className="h-4 w-4" />
            Choose manually
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart">
          <form onSubmit={search} className="mb-4 flex gap-2">
            <Input
              className="flex-1"
              maxLength={300}
              aria-label="Reason for swapping"
              placeholder="Why? e.g. lower back pain, rack is taken (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button type="submit" loading={loading} icon={!loading ? Wand2 : undefined} className="!px-4">
              Find
            </Button>
          </form>

          {error && <p className="mb-3 text-sm text-danger">{error}</p>}

          {result && (
            <div className="space-y-3">
              <Badge variant="ai">
                <Sparkles className="h-3.5 w-3.5" />
                {result.source === 'ai' ? 'Picked by AI coach' : 'Rule-based picks (AI unavailable)'}
              </Badge>
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
        </TabsContent>

        <TabsContent value="manual">
          <ExercisePicker catalog={catalog} excludeIds={[...workoutExerciseIds]} initialGroup={muscle} actionLabel="Swap" onPick={onSelect} />
        </TabsContent>
      </Tabs>
    </Modal>
  );
};

export default SwapModal;
