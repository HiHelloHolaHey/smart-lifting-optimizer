/** Single source of truth for how workouts and goals are labelled across the app. */

const SPLIT_LABELS = {
  PPL_PUSH: 'Push Day',
  PPL_PULL: 'Pull Day',
  PPL_LEGS: 'Leg Day',
  UPPER: 'Upper Body',
  LOWER: 'Lower Body',
  FULL_BODY: 'Full Body',
};

/** Display name for a workout (custom/template name wins over the split type). */
export const workoutName = (w) => (w?.name && w.name.trim()) || SPLIT_LABELS[w?.split_type] || 'Workout';

export const GOAL_LABELS = { strength: 'Strength', hypertrophy: 'Hypertrophy', weight_loss: 'Weight Loss', endurance: 'Endurance' };
export const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export const formatDuration = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) return null;
  const mins = Math.max(0, Math.round((new Date(endedAt) - new Date(startedAt)) / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};

export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};
