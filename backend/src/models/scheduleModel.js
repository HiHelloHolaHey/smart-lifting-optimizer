const db = require('../config/db');

const upsertSchedule = async (userId, data) => {
  const { gymOpenTime, gymCloseTime, busyTimesJson, preferredFrequency, goalPriority } = data;
  return db.one(
    `INSERT INTO schedules (user_id, gym_open_time, gym_close_time, busy_times_json, preferred_frequency, goal_priority)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       gym_open_time = EXCLUDED.gym_open_time,
       gym_close_time = EXCLUDED.gym_close_time,
       busy_times_json = EXCLUDED.busy_times_json,
       preferred_frequency = EXCLUDED.preferred_frequency,
       goal_priority = EXCLUDED.goal_priority
     RETURNING *`,
    [userId, gymOpenTime, gymCloseTime, JSON.stringify(busyTimesJson), preferredFrequency, goalPriority]
  );
};

const findByUserId = async (userId) => {
  return db.oneOrNone('SELECT * FROM schedules WHERE user_id = $1', [userId]);
};

module.exports = {
  upsertSchedule,
  findByUserId
};
