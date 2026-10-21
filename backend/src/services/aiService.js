const db = require('../config/db');
const llm = require('./llmService');
const workoutSetModel = require('../models/workoutSetModel');
const exerciseModel = require('../models/exerciseModel');
const progressiveOverloadService = require('./progressiveOverloadService');
const swapService = require('./swapService');

/**
 * Summarises the last `n` sessions of an exercise as compact text for prompts.
 */
const summariseHistory = async (userId, exerciseId, n = 3) => {
  const rows = await workoutSetModel.getLastNSessionsForExercise(userId, exerciseId, n);
  const byWorkout = new Map();
  rows.forEach((r) => {
    if (!byWorkout.has(r.workout_id)) byWorkout.set(r.workout_id, { date: r.scheduled_date, sets: [] });
    byWorkout.get(r.workout_id).sets.push(`${r.weight_kg}kg x ${r.reps}`);
  });
  return [...byWorkout.values()]
    .slice(0, n)
    .map((s) => `${new Date(s.date).toISOString().slice(0, 10)}: ${s.sets.join(', ')}`);
};

/**
 * 2-sentence coaching tip for a planned workout.
 * @param {string} userId
 * @param {string} workoutId
 * @returns {Promise<{brief: string, source: 'ai'|'fallback', exercises: Object[]}>}
 */
const preWorkoutBrief = async (userId, workoutId) => {
  const planned = await db.any(
    `SELECT DISTINCT e.id, e.name
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.workout_id = $1 AND w.user_id = $2`,
    [workoutId, userId]
  );
  if (planned.length === 0) {
    const err = new Error('Workout not found or has no exercises');
    err.status = 404;
    throw err;
  }

  const exercises = [];
  for (const ex of planned.slice(0, 6)) {
    const history = await summariseHistory(userId, ex.id, 3);
    const suggestion = await progressiveOverloadService.calculateDeterministic(userId, ex.id);
    exercises.push({ id: ex.id, name: ex.name, history, suggestion });
  }

  const user = await db.oneOrNone('SELECT first_name, goal, experience_level FROM users WHERE id = $1', [userId]);

  const fallback = () => {
    const top = exercises.find((e) => e.history.length) || exercises[0];
    const s = top.suggestion;
    return `Today's focus: ${top.name}. Aim for ${s.suggested_weight_kg}kg x ${s.suggested_reps} - ${s.increment_reason} Keep RPE under 9 and stay crisp on form.`;
  };

  try {
    const lines = exercises.map(
      (e) =>
        `- ${e.name}: last sessions [${e.history.join(' | ') || 'no history'}]; rule-based target ${e.suggestion.suggested_weight_kg}kg x ${e.suggestion.suggested_reps}`
    );
    const brief = await llm.generateText(
      `You are a concise strength coach. Athlete: ${user?.first_name || 'lifter'}, goal ${user?.goal || 'general'}, level ${user?.experience_level || 'unknown'}.\n` +
        `Today's planned exercises and recent history:\n${lines.join('\n')}\n\n` +
        `Write EXACTLY 2 sentences of personalised coaching, referencing specific numbers from the history. Include an RPE cue. No headings or lists.`
    );
    return { brief, source: 'ai', exercises };
  } catch (err) {
    console.warn('[ai] pre-workout-brief fallback:', err.message);
    return { brief: fallback(), source: 'fallback', exercises };
  }
};

/**
 * Recommend 2 equivalent exercises under a constraint.
 * LLM can only choose from DB candidates, so returned IDs are always valid.
 */
const smartSwap = async (userId, exerciseId, reason) => {
  const original = await exerciseModel.findById(exerciseId);
  if (!original) {
    const err = new Error('Exercise not found');
    err.status = 404;
    throw err;
  }

  const fallbackResult = async () => {
    const alts = await swapService.findAlternatives(exerciseId);
    return {
      source: 'fallback',
      alternatives: alts.slice(0, 2).map((a) => ({ ...a, rationale: 'Same muscle group with different equipment.' })),
    };
  };

  if (!llm.isConfigured()) return fallbackResult();

  try {
    const candidates = await db.any(
      'SELECT id, name, equipment_needed, is_compound FROM exercises WHERE muscle_group = $1 AND id <> $2',
      [original.muscle_group, exerciseId]
    );
    if (candidates.length === 0) return fallbackResult();

    const result = await llm.generateJson(
      `A lifter wants to swap "${original.name}" (muscle group: ${original.muscle_group}, equipment: ${JSON.stringify(original.equipment_needed)}).\n` +
        `Constraint / reason: ${reason ? JSON.stringify(reason) : 'none given - just wants variety'}.\n` +
        `Choose the 2 most biomechanically equivalent exercises ONLY from this list (use exact ids):\n${JSON.stringify(candidates)}\n` +
        `Respect the constraint (e.g. avoid spinal loading for back pain; avoid the equipment that is taken).\n` +
        `Return JSON: {"alternatives":[{"exercise_id":number,"rationale":"one short sentence"},{"exercise_id":number,"rationale":"..."}]}`
    );

    const byId = new Map(candidates.map((c) => [c.id, c]));
    const alternatives = (result.alternatives || [])
      .filter((a) => byId.has(Number(a.exercise_id)))
      .slice(0, 2)
      .map((a) => ({ ...byId.get(Number(a.exercise_id)), muscle_group: original.muscle_group, rationale: String(a.rationale || '') }));

    if (alternatives.length === 0) throw new Error('No valid alternatives from LLM');
    return { source: 'ai', alternatives };
  } catch (err) {
    console.warn('[ai] smart-swap fallback:', err.message);
    return fallbackResult();
  }
};

/**
 * Parse natural language into a structured template mapped to DB exercise IDs.
 */
const generateRoutine = async (userId, prompt) => {
  const catalog = await db.any('SELECT id, name, muscle_group, equipment_needed, is_compound FROM exercises ORDER BY id');
  const byId = new Map(catalog.map((c) => [c.id, c]));

  const fallbackRoutine = () => {
    const text = prompt.toLowerCase();
    const wantEquip = ['dumbbell', 'barbell', 'cable', 'machine', 'bodyweight'].filter((e) => text.includes(e));
    const pool = catalog.filter(
      (c) => wantEquip.length === 0 || (c.equipment_needed || []).some((eq) => wantEquip.includes(eq))
    );
    const minutes = parseInt((text.match(/(\d+)\s*(min|minute)/) || [])[1], 10) || 45;
    const count = Math.max(3, Math.min(8, Math.floor(minutes / 8)));
    const groups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];
    const picks = [];
    for (const g of groups) {
      const ex = pool.find((c) => c.muscle_group.toLowerCase() === g.toLowerCase() && !picks.includes(c));
      if (ex) picks.push(ex);
      if (picks.length >= count) break;
    }
    return {
      name: 'Quick Routine',
      source: 'fallback',
      exercises: picks.map((p) => ({ exercise_id: p.id, name: p.name, muscle_group: p.muscle_group, sets: 3, rep_min: 8, rep_max: 12 })),
    };
  };

  if (!llm.isConfigured()) return fallbackRoutine();

  try {
    const result = await llm.generateJson(
      `Build a workout from this request: ${JSON.stringify(prompt)}.\n` +
        `Use ONLY exercises from this catalog (exact ids). Respect available equipment and time (roughly 8-10 min per exercise).\n` +
        `Catalog: ${JSON.stringify(catalog.map((c) => ({ id: c.id, n: c.name, m: c.muscle_group, e: c.equipment_needed })))}\n` +
        `Return JSON: {"name":string,"exercises":[{"exercise_id":number,"sets":number,"rep_min":number,"rep_max":number}]} in recommended order.`
    );
    const exercises = (result.exercises || [])
      .filter((e) => byId.has(Number(e.exercise_id)))
      .slice(0, 12)
      .map((e) => {
        const c = byId.get(Number(e.exercise_id));
        const repMin = Math.max(1, Math.min(30, parseInt(e.rep_min, 10) || 8));
        const repMax = Math.max(repMin, Math.min(30, parseInt(e.rep_max, 10) || 12));
        return { exercise_id: c.id, name: c.name, muscle_group: c.muscle_group, sets: Math.max(1, Math.min(8, parseInt(e.sets, 10) || 3)), rep_min: repMin, rep_max: repMax };
      });
    if (exercises.length === 0) throw new Error('No valid exercises from LLM');
    return { name: String(result.name || 'AI Routine').slice(0, 60), source: 'ai', exercises };
  } catch (err) {
    console.warn('[ai] generate-routine fallback:', err.message);
    return fallbackRoutine();
  }
};

module.exports = { preWorkoutBrief, smartSwap, generateRoutine };
