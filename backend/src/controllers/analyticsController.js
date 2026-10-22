const db = require('../config/db');

const DAY = 86400000;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const mondayOf = (d) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x;
};
const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Dashboard numbers for the current user. A brand-new account gets zeros / empty series (no demo data).
 */
const summary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const weekStart = mondayOf(new Date());
    const eightWeeksAgo = new Date(weekStart.getTime() - 7 * 7 * DAY);

    const [planned, setRows] = await Promise.all([
      db.one(
        `SELECT COUNT(*)::int AS planned,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
         FROM workouts WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date < $3`,
        [userId, weekStart, new Date(weekStart.getTime() + 7 * DAY)]
      ),
      db.any(
        `SELECT to_char(COALESCE(ws.completed_at, w.scheduled_date) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
                COUNT(*)::int AS sets,
                COALESCE(SUM(ws.weight_kg * ws.reps), 0)::float AS volume
         FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
         WHERE w.user_id = $1 AND ws.completed = true AND ws.set_type = 'working'
           AND COALESCE(ws.completed_at, w.scheduled_date) >= $2
         GROUP BY 1`,
        [userId, eightWeeksAgo]
      ),
    ]);

    const byDay = new Map(setRows.map((r) => [r.day, r]));

    // Weekly volume series (8 weeks, zero-filled)
    const weekly = [];
    for (let i = 0; i < 8; i++) {
      const start = new Date(eightWeeksAgo.getTime() + i * 7 * DAY);
      let volume = 0;
      for (let d = 0; d < 7; d++) volume += byDay.get(iso(new Date(start.getTime() + d * DAY)))?.volume || 0;
      weekly.push({ week: iso(start).slice(5), volume: Math.round(volume) });
    }

    // Heatmap for the current week
    const days = DAY_LABELS.map((label, i) => {
      const date = new Date(weekStart.getTime() + i * DAY);
      const row = byDay.get(iso(date));
      return { day: label, date: iso(date), volume: Math.round(row?.volume || 0), sets: row?.sets || 0 };
    });
    const maxVol = Math.max(0, ...days.map((d) => d.volume));
    days.forEach((d) => { d.level = d.volume === 0 ? 0 : Math.max(1, Math.ceil((d.volume / maxVol) * 4)); });

    const weekSets = days.reduce((a, d) => a + d.sets, 0);
    const weekVolume = days.reduce((a, d) => a + d.volume, 0);

    res.json({
      week: { planned: planned.planned, completed: planned.completed, sets: weekSets, volume: weekVolume },
      weekly_volume: weekly,
      heatmap: days,
    });
  } catch (error) {
    next(error);
  }
};

/** Lifetime stats for the profile page. */
const profileStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [totals, topLifts, muscles, weeks] = await Promise.all([
      db.one(
        `SELECT COUNT(*) FILTER (WHERE w.status = 'completed')::int AS workouts,
                COALESCE(SUM(EXTRACT(EPOCH FROM (w.ended_at - w.started_at))) FILTER (WHERE w.status = 'completed' AND w.ended_at IS NOT NULL AND w.started_at IS NOT NULL), 0)::float AS seconds,
                COUNT(*) FILTER (WHERE w.status = 'completed' AND w.ended_at IS NOT NULL AND w.started_at IS NOT NULL)::int AS timed
         FROM workouts w WHERE w.user_id = $1`,
        [userId]
      ),
      db.any(
        `SELECT e.name, MAX(ws.weight_kg)::float AS max_kg,
                (ARRAY_AGG(ws.reps ORDER BY ws.weight_kg DESC, ws.reps DESC))[1] AS reps
         FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id JOIN exercises e ON e.id = ws.exercise_id
         WHERE w.user_id = $1 AND ws.completed = true AND ws.set_type = 'working' AND ws.weight_kg > 0
         GROUP BY e.name ORDER BY max_kg DESC LIMIT 3`,
        [userId]
      ),
      db.any(
        `SELECT e.muscle_group, COUNT(*)::int AS sets,
                COALESCE(SUM(ws.weight_kg * ws.reps), 0)::float AS volume
         FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id JOIN exercises e ON e.id = ws.exercise_id
         WHERE w.user_id = $1 AND ws.completed = true AND ws.set_type = 'working'
         GROUP BY e.muscle_group ORDER BY sets DESC`,
        [userId]
      ),
      db.any(
        `SELECT DISTINCT to_char(date_trunc('week', COALESCE(ended_at, scheduled_date) AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS week
         FROM workouts WHERE user_id = $1 AND status = 'completed' ORDER BY week DESC`,
        [userId]
      ),
    ]);

    // Streak = consecutive weeks (ending this week or last week) with at least one completed workout
    let streak = 0;
    let cursor = mondayOf(new Date()).getTime();
    const have = new Set(weeks.map((w) => w.week));
    if (!have.has(iso(new Date(cursor)))) cursor -= 7 * DAY; // this week not trained yet: don't break streak
    while (have.has(iso(new Date(cursor)))) { streak++; cursor -= 7 * DAY; }

    res.json({
      workouts: totals.workouts,
      sets: muscles.reduce((a, m) => a + m.sets, 0),
      volume: Math.round(muscles.reduce((a, m) => a + m.volume, 0)),
      avg_minutes: totals.timed ? Math.round(totals.seconds / totals.timed / 60) : null,
      streak_weeks: streak,
      top_lifts: topLifts,
      favourite_muscle: muscles[0]?.muscle_group || null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { summary, profileStats };
