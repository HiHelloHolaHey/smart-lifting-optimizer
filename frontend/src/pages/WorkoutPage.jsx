import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useProgressOverload } from '../hooks/useProgressOverload';
import { workouts, exercises as exercisesApi } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const OverloadChip = ({ exerciseId }) => {
  const { suggestion, loading } = useProgressOverload(exerciseId);
  
  if (loading || !suggestion) return null;
  
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
      <TrendingUp className="w-3.5 h-3.5" />
      Suggested: {suggestion.target_weight}kg × {suggestion.target_reps} reps ↑2.5%
    </div>
  );
};

const SwapModal = ({ isOpen, onClose, exerciseId, onSwap }) => {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && exerciseId) {
      setLoading(true);
      exercisesApi.swap(exerciseId)
        .then(res => setAlternatives(res.data.alternatives || res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, exerciseId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Swap Exercise">
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {alternatives.length > 0 ? alternatives.map(alt => (
            <button
              key={alt.id || alt._id}
              onClick={() => onSwap(alt)}
              className="w-full p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700/60 transition-colors text-left flex flex-col gap-2"
            >
              <div className="font-medium text-slate-200">{alt.name}</div>
              <div className="flex gap-2">
                <Badge variant="info">{alt.muscle_group}</Badge>
                {alt.equipment && <Badge variant="default">{alt.equipment}</Badge>}
              </div>
            </button>
          )) : (
            <div className="text-center py-8 text-slate-400">No alternatives found.</div>
          )}
        </div>
      )}
    </Modal>
  );
};

const WorkoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchWorkout, currentWorkout, logSet, loading } = useWorkout();
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [currentSwapExerciseId, setCurrentSwapExerciseId] = useState(null);
  
  // Local state for editing sets
  const [localSets, setLocalSets] = useState({});

  useEffect(() => {
    fetchWorkout(id);
  }, [id, fetchWorkout]);

  useEffect(() => {
    if (currentWorkout) {
      const initialSets = {};
      currentWorkout.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          initialSets[`${ex._id || ex.id}-${set._id || set.id}`] = {
            weight: set.actual_weight || set.target_weight || '',
            reps: set.actual_reps || set.target_reps || '',
            completed: set.completed || false
          };
        });
      });
      setLocalSets(initialSets);
    }
  }, [currentWorkout]);

  const handleSetChange = (exId, setId, field, value) => {
    setLocalSets(prev => ({
      ...prev,
      [`${exId}-${setId}`]: {
        ...prev[`${exId}-${setId}`],
        [field]: value
      }
    }));
  };

  const handleCompleteSet = async (exId, setId) => {
    const key = `${exId}-${setId}`;
    const data = localSets[key];
    const newCompleted = !data.completed;
    
    // Optimistic update
    handleSetChange(exId, setId, 'completed', newCompleted);
    
    try {
      await logSet(id, setId, {
        actual_weight: Number(data.weight),
        actual_reps: Number(data.reps),
        completed: newCompleted
      });
    } catch (err) {
      // Revert on error
      handleSetChange(exId, setId, 'completed', !newCompleted);
    }
  };

  const handleFinishWorkout = () => {
    setIsCompleted(true);
    // Ideally update workout status on backend
    setTimeout(() => {
      navigate('/dashboard');
    }, 2500);
  };

  const openSwap = (exercise) => {
    setCurrentSwapExerciseId(exercise.exercise_id || exercise._id);
    setSwapModalOpen(true);
  };

  const handleSwap = async (newExercise) => {
    // In a real app, call API to swap in workout then refetch.
    setSwapModalOpen(false);
    await fetchWorkout(id); // Reload to get new exercise
  };

  if (loading && !currentWorkout) return <LoadingSpinner />;
  if (!currentWorkout) return <div className="p-8 text-center text-slate-400">Workout not found.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative">
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-center space-y-4 transform scale-150">
            <div className="text-6xl animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-electric-indigo">
              Workout Complete!
            </h2>
            <p className="text-slate-400">Great job. Returning to dashboard...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{currentWorkout.split_type} Day</h1>
              <p className="text-sm text-slate-400">{new Date(currentWorkout.scheduled_date).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge variant={currentWorkout.status === 'completed' ? 'success' : 'info'}>
            {currentWorkout.status === 'completed' ? 'Completed' : 'In Progress'}
          </Badge>
        </div>
      </header>

      {/* Exercises */}
      <main className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {currentWorkout.exercises?.map((ex, index) => {
          const exId = ex._id || ex.id || index;
          return (
            <Card key={exId} className="overflow-hidden p-0 border-slate-800">
              <div className="p-5 border-b border-slate-800 bg-slate-900/30 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold">{ex.name || 'Exercise'}</h3>
                    <Badge variant="default">{ex.muscle_group || 'Target'}</Badge>
                  </div>
                  <OverloadChip exerciseId={ex.exercise_id || ex._id} />
                </div>
                <button 
                  onClick={() => openSwap(ex)}
                  className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                  title="Swap Exercise"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-2 md:p-5 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="pb-3 pl-2 w-12">Set</th>
                      <th className="pb-3 px-2">Target</th>
                      <th className="pb-3 px-2">Weight (kg)</th>
                      <th className="pb-3 px-2">Reps</th>
                      <th className="pb-3 pr-2 w-16 text-center">Done</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {ex.sets?.map((set, sIdx) => {
                      const setId = set._id || set.id || sIdx;
                      const key = `${exId}-${setId}`;
                      const setData = localSets[key] || {};
                      const isCompleted = setData.completed;

                      return (
                        <tr key={setId} className={`transition-colors ${isCompleted ? 'bg-green-500/5' : ''}`}>
                          <td className="py-3 pl-2 text-slate-400 font-medium">{sIdx + 1}</td>
                          <td className="py-3 px-2 text-sm text-slate-500">
                            {set.target_weight}kg × {set.target_reps}
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              className={`w-20 bg-slate-900 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                                isCompleted ? 'border-green-500/30 text-green-100' : 'border-slate-700 text-slate-100'
                              }`}
                              value={setData.weight || ''}
                              onChange={(e) => handleSetChange(exId, setId, 'weight', e.target.value)}
                              disabled={isCompleted}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              className={`w-20 bg-slate-900 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                                isCompleted ? 'border-green-500/30 text-green-100' : 'border-slate-700 text-slate-100'
                              }`}
                              value={setData.reps || ''}
                              onChange={(e) => handleSetChange(exId, setId, 'reps', e.target.value)}
                              disabled={isCompleted}
                            />
                          </td>
                          <td className="py-3 pr-2 text-center">
                            <button
                              onClick={() => handleCompleteSet(exId, setId)}
                              className={`p-1.5 rounded-lg transition-all ${
                                isCompleted 
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}

        <div className="pt-6 pb-12 flex justify-center">
          <Button 
            size="lg" 
            onClick={handleFinishWorkout}
            className="w-full md:w-auto shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            Complete Workout
          </Button>
        </div>
      </main>

      <SwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        exerciseId={currentSwapExerciseId}
        onSwap={handleSwap}
      />
    </div>
  );
};

export default WorkoutPage;
