import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboarding, schedule } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import TimeInput from '../components/ui/TimeInput';
import { ChevronRight, Target, Flame, Activity, TrendingUp, CheckCircle2, Info, Check } from 'lucide-react';

const STORAGE_KEY = 'onboarding-form';
const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

const DEFAULT_FORM = {
  firstName: '',
  height: '',
  weight: '',
  experience_level: 'beginner',
  primary_goal: 'hypertrophy',
  split_preference: 'PPL',
  sameGym: null, // null = not chosen, true / false
  gym_open_time: '06:00',
  gym_close_time: '22:00',
  goal_priority: 'morning',
  weekly_frequency: 4,
};

const FIELD_STEP = {
  firstName: 1, heightCm: 1, weightKg: 1, experienceLevel: 1,
  goal: 2, splitType: 3,
};

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      step: [1, 2, 3, 4].includes(parsed.step) ? parsed.step : 1,
      form: { ...DEFAULT_FORM, ...(parsed.form || {}) },
    };
  } catch {
    return null;
  }
};

const toMinutes = (t) => {
  const [h, m] = (t || '').split(':').map(Number);
  return h * 60 + m;
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [saved] = useState(loadSaved);
  const [step, setStep] = useState(saved?.step || 1);
  const [formData, setFormData] = useState(saved?.form || DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (result) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form: formData }));
    } catch { /* ignore quota errors */ }
  }, [step, formData, result]);

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearErr = (...keys) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!formData.firstName.trim()) errs.firstName = 'Please enter your first name.';
      const h = Number(formData.height);
      if (formData.height === '' || Number.isNaN(h) || h < 100 || h > 250) {
        errs.heightCm = 'Height must be between 100 and 250 cm.';
      }
      const w = Number(formData.weight);
      if (formData.weight === '' || Number.isNaN(w) || w < 30 || w > 400) {
        errs.weightKg = 'Weight must be between 30 and 400 kg.';
      }
    }
    if (s === 4 && formData.sameGym === true) {
      if (toMinutes(formData.gym_close_time) <= toMinutes(formData.gym_open_time)) {
        errs.gymTime = 'Closing time must be after opening time.';
      }
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length === 0) setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    const errs = validateStep(4);
    setFieldErrors(errs);
    if (Object.keys(errs).length || formData.sameGym === null) return;

    setIsLoading(true);
    setError('');
    try {
      const sched = {
        busyTimes: [],
        preferredFrequency: formData.weekly_frequency,
        goalPriority: formData.goal_priority,
      };
      if (formData.sameGym === true) {
        sched.gymOpenTime = formData.gym_open_time;
        sched.gymCloseTime = formData.gym_close_time;
      }

      const response = await onboarding.onboard({
        firstName: formData.firstName.trim(),
        heightCm: Number(formData.height),
        weightKg: Number(formData.weight),
        experienceLevel: formData.experience_level,
        goal: formData.primary_goal,
        splitType: formData.split_preference,
        schedule: sched,
      });

      await schedule.generate(sched);
      await refreshUser();

      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setResult({
        count: response?.data?.workouts?.length ?? 0,
        name: formData.firstName.trim(),
      });
    } catch (err) {
      console.error('Onboarding error:', err?.response?.data || err.message);
      if (!err.response) {
        setError(NETWORK_ERROR);
      } else {
        const data = err.response.data;
        const msg = data?.error || 'Failed to complete onboarding. Please try again.';
        setError(msg);
        if (data?.field) {
          setFieldErrors({ [data.field]: msg });
          if (FIELD_STEP[data.field]) setStep(FIELD_STEP[data.field]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const errInput = (k) => (fieldErrors[k] ? '!border-red-500' : '');
  const FieldError = ({ id, name }) =>
    fieldErrors[name] ? (
      <p id={id} className="text-red-400 text-sm mt-1.5">{fieldErrors[name]}</p>
    ) : null;

  const freq = formData.weekly_frequency;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-100">About you</h2>
            <div>
              <label htmlFor="ob-first-name" className="block text-sm font-medium text-slate-400 mb-1.5">First name</label>
              <input
                id="ob-first-name"
                type="text"
                autoComplete="given-name"
                className={`input-field ${errInput('firstName')}`}
                value={formData.firstName}
                onChange={(e) => { updateForm('firstName', e.target.value); clearErr('firstName'); }}
                placeholder="Alex"
                aria-invalid={!!fieldErrors.firstName}
                aria-describedby={fieldErrors.firstName ? 'ob-first-name-err' : undefined}
              />
              <FieldError id="ob-first-name-err" name="firstName" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ob-height" className="block text-sm font-medium text-slate-400 mb-1.5">Height (cm)</label>
                <input
                  id="ob-height"
                  type="number"
                  inputMode="numeric"
                  className={`input-field ${errInput('heightCm')}`}
                  value={formData.height}
                  onChange={(e) => { updateForm('height', e.target.value); clearErr('heightCm'); }}
                  placeholder="e.g. 175"
                  aria-invalid={!!fieldErrors.heightCm}
                  aria-describedby={fieldErrors.heightCm ? 'ob-height-err' : undefined}
                />
                <FieldError id="ob-height-err" name="heightCm" />
              </div>
              <div>
                <label htmlFor="ob-weight" className="block text-sm font-medium text-slate-400 mb-1.5">Weight (kg)</label>
                <input
                  id="ob-weight"
                  type="number"
                  inputMode="decimal"
                  className={`input-field ${errInput('weightKg')}`}
                  value={formData.weight}
                  onChange={(e) => { updateForm('weight', e.target.value); clearErr('weightKg'); }}
                  placeholder="e.g. 75"
                  aria-invalid={!!fieldErrors.weightKg}
                  aria-describedby={fieldErrors.weightKg ? 'ob-weight-err' : undefined}
                />
                <FieldError id="ob-weight-err" name="weightKg" />
              </div>
            </div>
            <div>
              <span id="ob-exp-label" className="block text-sm font-medium text-slate-400 mb-3">Experience Level</span>
              <div role="radiogroup" aria-labelledby="ob-exp-label" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'beginner', label: 'Beginner' },
                  { id: 'intermediate', label: 'Intermediate' },
                  { id: 'advanced', label: 'Advanced' },
                ].map((level) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={formData.experience_level === level.id}
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
              ].map((goal) => (
                <button
                  type="button"
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
                { id: 'UPPER', label: 'Upper / Lower', desc: 'Alternates upper and lower body (4 days/week)' },
                { id: 'FULL_BODY', label: 'Full Body', desc: 'Works all muscles each session (3 days/week)' },
              ].map((split) => (
                <button
                  type="button"
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

            <div>
              <span id="ob-gym-label" className="block text-sm font-medium text-slate-400 mb-3">
                Do you train at the same gym every day?
              </span>
              <div role="radiogroup" aria-labelledby="ob-gym-label" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { v: true, label: 'Yes, same gym' },
                  { v: false, label: 'No, I train at different places' },
                ].map((opt) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={formData.sameGym === opt.v}
                    key={String(opt.v)}
                    onClick={() => { updateForm('sameGym', opt.v); clearErr('gymTime'); }}
                    className={`p-5 rounded-2xl border text-center font-medium transition-all ${
                      formData.sameGym === opt.v
                        ? 'border-electric-indigo bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-400">
                <Info className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" aria-hidden="true" />
                <p>
                  <span className="font-medium text-slate-300">Why we ask:</span> if your gym has fixed opening hours,
                  we use them to suggest workout times when you can actually train, and to power upcoming smart
                  scheduling and calendar features. If you switch gyms, skip this — we'll suggest times based only on
                  your busy times.
                </p>
              </div>
            </div>

            {formData.sameGym === true && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <TimeInput
                    id="ob-gym-open"
                    label="Gym opens"
                    value={formData.gym_open_time}
                    onChange={(v) => { updateForm('gym_open_time', v); clearErr('gymTime'); }}
                  />
                  <TimeInput
                    id="ob-gym-close"
                    label="Gym closes"
                    value={formData.gym_close_time}
                    onChange={(v) => { updateForm('gym_close_time', v); clearErr('gymTime'); }}
                  />
                </div>
                {fieldErrors.gymTime && (
                  <p role="alert" className="text-red-400 text-sm mt-2">{fieldErrors.gymTime}</p>
                )}
              </div>
            )}

            <div>
              <span id="ob-pref-label" className="block text-sm font-medium text-slate-400 mb-3">Preferred Time</span>
              <div role="radiogroup" aria-labelledby="ob-pref-label" className="grid grid-cols-2 gap-3">
                {[
                  { id: 'morning', label: 'Morning' },
                  { id: 'evening', label: 'Evening' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.goal_priority === opt.id
                        ? 'border-electric-indigo bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
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
              <label htmlFor="ob-frequency" className="block text-sm font-medium text-slate-400 mb-1.5">
                Weekly Frequency:{' '}
                <span className="text-indigo-400 font-semibold">{freq} {freq === 1 ? 'day' : 'days'}</span>
              </label>
              <input
                id="ob-frequency"
                type="range"
                min="1"
                max="7"
                step="1"
                value={freq}
                onChange={(e) => updateForm('weekly_frequency', parseInt(e.target.value, 10))}
                className="w-full accent-electric-indigo"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 day</span><span>7 days</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-electric-indigo/10 border border-electric-indigo/30 flex items-center justify-center animate-pulse">
              <Check className="w-14 h-14 text-electric-indigo" strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-3">You're all set, {result.name}!</h1>
            <p className="text-slate-400 mb-8">
              We've created your 4-week starting program ({result.count} workouts). Open the Workouts page to review
              and start your first session.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/workouts')}>View my workouts</Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const needsGymChoice = step === 4 && formData.sameGym === null;

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
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((step / 4) * 100)}>
            <div
              className="h-full bg-electric-indigo transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-5 sm:p-8">
          {renderStep()}

          {error && (
            <div role="alert" className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {needsGymChoice && (
            <p className="mt-4 text-sm text-slate-500 text-right">Choose an option above to finish setup.</p>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => { setError(''); setStep((s) => s - 1); }}>Back</Button>
            ) : <div />}

            {step < 4 ? (
              <Button onClick={handleNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={isLoading} disabled={isLoading || formData.sameGym === null}>
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
