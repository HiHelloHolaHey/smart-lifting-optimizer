const aiService = require('../services/aiService');
const templateModel = require('../models/templateModel');
const workoutLogModel = require('../models/workoutLogModel');
const db = require('../config/db');

const preWorkoutBrief = async (req, res, next) => {
  try {
    const { workout_id: workoutId } = req.body;
    if (!workoutId) return res.status(400).json({ error: 'workout_id is required' });
    res.status(200).json(await aiService.preWorkoutBrief(req.user.id, workoutId));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

const smartSwap = async (req, res, next) => {
  try {
    const exerciseId = parseInt(req.body.exercise_id, 10);
    if (!exerciseId) return res.status(400).json({ error: 'exercise_id is required' });
    const reason = req.body.reason ? String(req.body.reason).slice(0, 300) : '';
    res.status(200).json(await aiService.smartSwap(req.user.id, exerciseId, reason));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

const generateRoutine = async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || '').trim().slice(0, 500);
    if (prompt.length < 3) return res.status(400).json({ error: 'prompt is required' });
    res.status(200).json(await aiService.generateRoutine(req.user.id, prompt));
  } catch (error) {
    next(error);
  }
};

// ---- Templates ----
const sanitizeExercises = async (list) => {
  if (!Array.isArray(list)) return [];
  const ids = list.map((e) => parseInt(e.exercise_id, 10)).filter(Boolean);
  const valid = ids.length ? await db.any('SELECT id FROM exercises WHERE id IN ($1:csv)', [ids]) : [];
  const ok = new Set(valid.map((v) => v.id));
  return list
    .filter((e) => ok.has(parseInt(e.exercise_id, 10)))
    .slice(0, 30)
    .map((e) => {
      const repMin = Math.max(1, Math.min(50, parseInt(e.rep_min, 10) || 8));
      return {
        exercise_id: parseInt(e.exercise_id, 10),
        sets: Math.max(1, Math.min(10, parseInt(e.sets, 10) || 3)),
        rep_min: repMin,
        rep_max: Math.max(repMin, Math.min(50, parseInt(e.rep_max, 10) || 12)),
        // Optional default working weight (kg)
        weight_kg: Number(e.weight_kg) > 0 ? Math.min(1000, Math.round(Number(e.weight_kg) * 2) / 2) : null,
      };
    });
};

const listTemplates = async (req, res, next) => {
  try {
    const rows = await templateModel.findByUser(req.user.id);
    // Hydrate exercise names for display
    const allIds = [...new Set(rows.flatMap((r) => r.exercise_order_json.map((e) => e.exercise_id)))];
    const names = allIds.length ? await db.any('SELECT id, name, muscle_group FROM exercises WHERE id IN ($1:csv)', [allIds]) : [];
    const byId = new Map(names.map((n) => [n.id, n]));
    res.json(
      rows.map((r) => ({
        ...r,
        exercise_order_json: r.exercise_order_json.map((e) => ({ ...e, name: byId.get(e.exercise_id)?.name, muscle_group: byId.get(e.exercise_id)?.muscle_group })),
      }))
    );
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'name is required' });
    const exercises = await sanitizeExercises(req.body.exercises);
    if (exercises.length === 0) return res.status(400).json({ error: 'Add at least one valid exercise' });
    res.status(201).json(await templateModel.create(req.user.id, name, exercises));
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'name is required' });
    const exercises = await sanitizeExercises(req.body.exercises);
    if (exercises.length === 0) return res.status(400).json({ error: 'Add at least one valid exercise' });
    const row = await templateModel.update(req.params.id, req.user.id, name, exercises);
    if (!row) return res.status(404).json({ error: 'Template not found' });
    res.json(row);
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const count = await templateModel.remove(req.params.id, req.user.id);
    if (!count) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/** Creates a scheduled workout (with sets) from a template. */
const startTemplate = async (req, res, next) => {
  try {
    const tpl = (await templateModel.findByUser(req.user.id)).find((t) => t.id === req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });

    const workoutId = await db.tx(async (t) => {
      const w = await t.one(
        `INSERT INTO workouts (user_id, scheduled_date, split_type, status, notes, name)
         VALUES ($1, NOW(), 'FULL_BODY', 'scheduled', $2, $3) RETURNING id`,
        [req.user.id, `Template: ${tpl.name}`, tpl.name]
      );
      for (const ex of tpl.exercise_order_json) {
        const last = await t.oneOrNone(
          `SELECT ws.weight_kg FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
           WHERE w.user_id = $1 AND ws.exercise_id = $2 AND ws.completed = true
           ORDER BY ws.completed_at DESC NULLS LAST LIMIT 1`,
          [req.user.id, ex.exercise_id]
        );
        for (let i = 1; i <= ex.sets; i++) {
          await t.none(
            `INSERT INTO workout_sets (workout_id, exercise_id, weight_kg, reps, set_number, set_type)
             VALUES ($1, $2, $3, $4, $5, 'working')`,
            [w.id, ex.exercise_id, ex.weight_kg ?? last?.weight_kg ?? null, ex.rep_max, i]
          );
        }
      }
      return w.id;
    });
    res.status(201).json({ workout_id: workoutId });
  } catch (error) {
    next(error);
  }
};

// ---- Exercises list ----
const listExercises = async (req, res, next) => {
  try {
    res.json(await db.any('SELECT id, name, muscle_group, equipment_needed, is_compound FROM exercises ORDER BY muscle_group, name'));
  } catch (error) {
    next(error);
  }
};

// ---- Analytics ----
const MUSCLE_ALIASES = {
  chest: 'chest', back: 'back', shoulders: 'shoulders', biceps: 'biceps', triceps: 'triceps',
  legs: 'legs', quads: 'legs', hamstrings: 'legs', calves: 'legs', glutes: 'glutes', core: 'core', abs: 'core',
};

/** Fatigue score 0-100 from 7-day sets (10+ working sets ≈ fully fatigued), decayed by recency. */
const recovery = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 86400000);
    const rows = await workoutLogModel.getMuscleVolume(req.user.id, since);
    const acc = {};
    rows.forEach((r) => {
      const key = MUSCLE_ALIASES[r.muscle_group.toLowerCase()] || r.muscle_group.toLowerCase();
      acc[key] = acc[key] || { sets: 0, volume: 0, last_trained: null };
      acc[key].sets += r.sets;
      acc[key].volume += r.volume;
      if (r.last_trained && (!acc[key].last_trained || r.last_trained > acc[key].last_trained)) acc[key].last_trained = r.last_trained;
    });
    const groups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core'];
    const result = groups.map((g) => {
      const d = acc[g] || { sets: 0, volume: 0, last_trained: null };
      const hours = d.last_trained ? (Date.now() - new Date(d.last_trained).getTime()) / 3600000 : null;
      const recencyFactor = hours === null ? 0 : Math.max(0.3, 1 - hours / 96);
      const fatigue = Math.min(100, Math.round((d.sets / 10) * 100 * recencyFactor));
      return { muscle: g, sets: d.sets, volume: Math.round(d.volume), fatigue, last_trained: d.last_trained };
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const volumeSummary = async (req, res, next) => {
  try {
    const rows = await workoutLogModel.getVolumeByWeek(req.user.id, 30);
    res.json(rows.map((r) => ({ week: r.week.slice(5), volume: Math.round(r.volume), sets: r.sets })));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  preWorkoutBrief, smartSwap, generateRoutine,
  listTemplates, createTemplate, updateTemplate, deleteTemplate, startTemplate,
  listExercises, recovery, volumeSummary,
};
