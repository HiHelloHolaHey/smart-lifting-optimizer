import { useEffect, useState } from 'react';

/**
 * Groups a workout's flat sets into ordered exercise blocks.
 * Within an exercise warm-ups come first, then working sets by number.
 * @param {Array} sets
 */
export const groupExercises = (sets = []) => {
  const map = new Map();
  sets.forEach((s) => {
    if (!map.has(s.exercise_id)) {
      map.set(s.exercise_id, { exercise_id: s.exercise_id, exercise_name: s.exercise_name, muscle_group: s.muscle_group, sets: [] });
    }
    map.get(s.exercise_id).sets.push(s);
  });
  map.forEach((ex) =>
    ex.sets.sort((a, b) => (a.set_type === b.set_type ? a.set_number - b.set_number : a.set_type === 'warmup' ? -1 : 1))
  );
  return [...map.values()];
};

/** First not-yet-completed set across the workout, or null when everything is done. */
export const findNextSet = (sets = []) => {
  for (const ex of groupExercises(sets)) {
    const next = ex.sets.find((s) => !s.completed);
    if (next) return { exercise: ex, set: next };
  }
  return null;
};

/** Re-renders every `ms` and returns Date.now() — for clocks and countdowns. */
export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
};

/** Treats null/''/0 weights as "not set". */
export const hasValue = (v) => v !== null && v !== undefined && v !== '' && Number(v) !== 0;
