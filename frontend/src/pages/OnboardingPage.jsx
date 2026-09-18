import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboarding, schedule } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, Target, Flame, Activity, TrendingUp, CheckCircle2 } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    experience_level: 'beginner',
    primary_goal: 'hypertrophy',
    split_preference: 'PPL',
    gym_open_time: '06:00',
    gym_close_time: '22:00',
    goal_priority: 'morning',
    weekly_frequency: 4,
    busy_times: [],
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Map frontend form fields → backend expected shape
      const onboardPayload = {
        experienceLevel: formData.experience_level,
        goal: formData.primary_goal,
        splitType: formData.split_preference === 'Upper/Lower' ? 'UPPER' : formData.split_preference === 'Full Body' ? 'FULL_BODY' : 'PPL',
        schedule: {
          gymOpenTime: formData.gym_open_time,
          gymCloseTime: formData.gym_close_time,
          busyTimes: formData.busy_times,
          preferredFrequency: formData.weekly_frequency,
          goalPriority: formData.goal_priority,
        },
      };

      await onboarding.onboard(onboardPayload);

      // Generate schedule with correct shape
      await schedule.generate({
        busyTimes: formData.busy_times,
        gymOpenTime: formData.gym_open_time,
        gymCloseTime: formData.gym_close_time,
        preferredFrequency: formData.weekly_frequency,
        goalPriority: formData.goal_priority,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err?.response?.data || err.message);
      setError(err?.response?.data?.error || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-100">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Height (cm)</label>
                <input type="number" className="input-field" value={formData.height} onChange={e => updateForm('height', e.target.value)} placeholder="180" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Weight (kg)</label>
                <input type="number" className="input-field" value={formData.weight} onChange={e => updateForm('weight', e.target.value)} placeholder="80" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Experience Level</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'beginner', label: 'Beginner' },
                  { id: 'intermediate', label: 'Intermediate' },
                  { id: 'advanced', label: 'Advanced' },
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => updateForm('experience_level', level.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      formData.experience_level === level.id
                        ? 'border-electric-indigo bg-indigo-500/10 text-indigo-400'
                        : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-100">Training Goal</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'strength', icon: Activity, label: 'Strength', emoji: '💪' },
                { id: 'hypertrophy', icon: TrendingUp, label: 'Hypertrophy', emoji: '🏋️' },
                { id: 'weight_loss', icon: Flame, label: 'Weight Loss', emoji: '⚖️' },
                { id: 'endurance', icon: Target, label: 'Endurance', emoji: '🏃' },
              ].map(goal => (
                <button
                  key={goal.id}
                  onClick={() => updateForm('primary_goal', goal.id)}
                  className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                    formData.primary_goal === goal.id
                      ? 'border-electric-indigo bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl">{goal.emoji}</span>
                  <span className="font-medium">{goal.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-100">Workout Split</h2>
            <div className="space-y-4">
              {[
                { id: 'PPL', label: 'Push / Pull / Legs', desc: 'Focuses on related muscle groups (3–6 days/week)' },
                { id: 'Upper/Lower', label: 'Upper / Lower', desc: 'Alternates upper and lower body (4 days/week)' },
                { id: 'Full Body', label: 'Full Body', desc: 'Works all muscles each session (3 days/week)' },
              ].map(split => (
                <button
                  key={split.id}
                  onClick={() => updateForm('split_preference', split.id)}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                    formData.split_preference === split.id
                      ? 'border-electric-indigo bg-indigo-500/10'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <div className={`mt-0.5 rounded-full p-0.5 ${formData.split_preference === split.id ? 'bg-electric-indigo text-white' : 'bg-slate-700 text-transparent'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-medium ${formData.split_preference === split.id ? 'text-indigo-400' : 'text-slate-200'}`}>{split.label}</div>
                    <div className="text-sm text-slate-500 mt-1">{split.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-100">Availability</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Gym Open Time</label>
                <input type="time" className="input-field" value={formData.gym_open_time} onChange={e => updateForm('gym_open_time', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Gym Close Time</label>
                <input type="time" className="input-field" value={formData.gym_close_time} onChange={e => updateForm('gym_close_time', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Preferred Time</label>
              <div className="flex gap-4">
                {[{ id: 'morning', label: 'Morning 🌅' }, { id: 'evening', label: 'Evening 🌙' }].map(opt => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={formData.goal_priority === opt.id}
                      onChange={() => updateForm('goal_priority', opt.id)}
                      className="text-electric-indigo focus:ring-electric-indigo bg-slate-800 border-slate-700"
                    />
                    <span className="text-slate-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Weekly Frequency: <span className="text-indigo-400 font-semibold">{formData.weekly_frequency} days</span>
              </label>
              <input
                type="range"
                min="2" max="6"
                value={formData.weekly_frequency}
                onChange={e => updateForm('weekly_frequency', parseInt(e.target.value))}
                className="w-full accent-electric-indigo"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>2 days</span><span>6 days</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Let's set you up</h1>
          <p className="text-slate-400">Personalize your Smart Lifting experience</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium text-slate-400 mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-electric-indigo transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-8">
          {renderStep()}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}

            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={isLoading}>
                {isLoading ? 'Setting up...' : 'Finish Setup ✓'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
