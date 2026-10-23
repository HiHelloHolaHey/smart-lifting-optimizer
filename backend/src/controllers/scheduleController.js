const schedulingService = require('../services/schedulingService');
const scheduleModel = require('../models/scheduleModel');
const db = require('../config/db');

const getSchedule = async (req, res, next) => {
  try {
    const row = await scheduleModel.findByUserId(req.user.id);
    if (!row) {
      return res.status(200).json({
        gym_open_time: '06:00',
        gym_close_time: '22:00',
        busy_times_json: [],
        preferred_frequency: 4,
        goal_priority: 'morning',
      });
    }
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
};

const generateSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const scheduleInput = req.body;

    const slots = await schedulingService.findAvailableSlots(scheduleInput);

    const saved = await scheduleModel.upsertSchedule(userId, {
      gymOpenTime: scheduleInput.gymOpenTime || '05:00',
      gymCloseTime: scheduleInput.gymCloseTime || '23:00',
      busyTimesJson: scheduleInput.busyTimes || [],
      preferredFrequency: scheduleInput.preferredFrequency,
      goalPriority: scheduleInput.goalPriority,
    });

    // Optionally realign the next N scheduled workouts to the newly generated slots
    if (scheduleInput.realignWorkouts && slots.length > 0) {
      const upcoming = await db.any(
        `SELECT id FROM workouts
         WHERE user_id = $1 AND status = 'scheduled' AND scheduled_date >= NOW() - INTERVAL '1 day'
         ORDER BY scheduled_date ASC
         LIMIT $2`,
        [userId, slots.length]
      );
      await db.tx(async (t) => {
        for (let i = 0; i < upcoming.length; i++) {
          await t.none('UPDATE workouts SET scheduled_date = $1 WHERE id = $2', [slots[i], upcoming[i].id]);
        }
      });
    }

    res.status(200).json({ slots, schedule: saved });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedule,
  generateSchedule,
};
