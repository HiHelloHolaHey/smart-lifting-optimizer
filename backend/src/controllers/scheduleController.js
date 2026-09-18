const schedulingService = require('../services/schedulingService');
const scheduleModel = require('../models/scheduleModel');

const generateSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const scheduleInput = req.body;
    
    const slots = await schedulingService.findAvailableSlots(scheduleInput);
    
    await scheduleModel.upsertSchedule(userId, {
      gymOpenTime: scheduleInput.gymOpenTime,
      gymCloseTime: scheduleInput.gymCloseTime,
      busyTimesJson: scheduleInput.busyTimes,
      preferredFrequency: scheduleInput.preferredFrequency,
      goalPriority: scheduleInput.goalPriority
    });

    res.status(200).json({ slots });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSchedule
};
